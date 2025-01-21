from flask import Flask, request, jsonify, url_for, render_template
from urllib.parse import urlparse
import asyncio
import re
import csv
from playwright.async_api import async_playwright
import os

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
        asyncio.run(scrape_url(url))

        # Generate download links, assuming files are saved in 'static' directory
        download_links = {
            'emails': url_for('static', filename='emails.csv'),
            'numbers': url_for('static', filename='numbers.csv'),
            'links': url_for('static', filename='page_links.csv')
        }

        return jsonify(download_links)
    except Exception as e:
        return jsonify({'error': 'An error occurred during processing.'}), 500

async def scrape_url(url):
    base_url = urlparse(url).netloc

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            await page.goto(url, wait_until='networkidle')
        except Exception as e:
            raise Exception(f"Failed to load URL: {e}")

        content = await page.content()

        links = await page.evaluate('''() => {
            return Array.from(document.querySelectorAll('a')).map(a => ({
                name: a.innerText,
                url: a.href
            }));
        }''')

        await browser.close()

        # Regex for emails and phone numbers
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        phone_pattern = r'\+?\d[\d\-\(\) ]{7,}\d'

        emails = re.findall(email_pattern, content)
        numbers = re.findall(phone_pattern, content)

        # Save the scraped data in the 'static' folder
        save_to_file('static/emails.csv', emails)
        save_to_file('static/numbers.csv', numbers)
        save_links_to_csv('static/page_links.csv', links, base_url)

def save_to_file(filename, data):
    with open(filename, 'w', encoding='utf-8') as file:
        for item in data:
            file.write(f"{item}\n")

def save_links_to_csv(filename, links, base_url):
    with open(filename, 'w', encoding='utf-8', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(["Link Name", "URL", "Internal/External"])
        for link in links:
            link_url = urlparse(link['url']).netloc
            link_type = "Internal" if link_url == base_url or link_url == '' else "External"
            writer.writerow([link['name'], link['url'], link_type])

if __name__ == '__main__':
    app.run(debug=True)
