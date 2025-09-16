from flask import Flask, request, jsonify, render_template, url_for
from urllib.parse import urlparse
import asyncio
import re
import csv
import os
from playwright.async_api import async_playwright

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/scrape', methods=['POST'])
def scrape():
    url = request.json.get('url')
    if not url:
        return jsonify({'error': 'URL is required'}), 400

    try:
        result = asyncio.run(scrape_url(url))

        # Save CSV files for download
        os.makedirs("static", exist_ok=True)
        save_list_to_csv("static/emails.csv", [["Email"], *[[e] for e in result["emails"]]])
        save_list_to_csv("static/numbers.csv", [["Number"], *[[n] for n in result["numbers"]]])
        save_links_to_csv("static/page_links.csv", result["links"])

        # Add CSV URLs to JSON response
        result["downloads"] = {
            "emails": url_for('static', filename='emails.csv'),
            "numbers": url_for('static', filename='numbers.csv'),
            "links": url_for('static', filename='page_links.csv')
        }

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


async def scrape_url(url):
    base_url = urlparse(url).netloc

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(url, wait_until='networkidle')
        content = await page.content()

        # ---- Extract links
        links = await page.evaluate('''() => {
            return Array.from(document.querySelectorAll('a')).map(a => ({
                name: a.innerText,
                url: a.href
            }));
        }''')

        await browser.close()

        # ---- Regex patterns
        emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', content)
        numbers = re.findall(r'\+?\d[\d\-\(\) ]{7,}\d', content)

        # ---- Add link type
        processed_links = []
        for link in links:
            link_url = urlparse(link['url']).netloc
            link_type = "Internal" if link_url == base_url or link_url == '' else "External"
            processed_links.append({
                "name": link['name'],
                "url": link['url'],
                "type": link_type
            })

        return {
            "emails": list(set(emails)),
            "numbers": list(set(numbers)),
            "links": processed_links
        }


def save_list_to_csv(filename, rows):
    with open(filename, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerows(rows)


def save_links_to_csv(filename, links):
    with open(filename, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["Link Name", "URL", "Type"])
        for link in links:
            writer.writerow([link["name"], link["url"], link["type"]])


if __name__ == '__main__':
    # Change from app.run(debug=True) to:
    app.run(host="0.0.0.0", port=9090, debug=True)

