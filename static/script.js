document.getElementById("scrape-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const url = document.querySelector(".url-input").value;

    const response = await fetch("/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
    });

    const data = await response.json();
    document.getElementById("scraped-results").style.display = "block";

    // ---- Emails ----
    if (data.emails && data.emails.length > 0) {
        let html = "<table><thead><tr><th>Email</th></tr></thead><tbody>";
        data.emails.forEach(email => {
            html += `<tr><td>${email}</td></tr>`;
        });
        html += "</tbody></table>";
        document.getElementById("emails-content").innerHTML = html;
    } else {
        document.getElementById("emails-content").innerHTML = "<p>No emails found</p>";
    }

    // ---- Numbers ----
    if (data.numbers && data.numbers.length > 0) {
        let html = "<table><thead><tr><th>Number</th></tr></thead><tbody>";
        data.numbers.forEach(num => {
            html += `<tr><td>${num}</td></tr>`;
        });
        html += "</tbody></table>";
        document.getElementById("numbers-content").innerHTML = html;
    } else {
        document.getElementById("numbers-content").innerHTML = "<p>No numbers found</p>";
    }

    // ---- Links ----
    if (data.links && data.links.length > 0) {
        let html = "<table><thead><tr><th>Link Name</th><th>URL</th><th>Type</th></tr></thead><tbody>";
        data.links.forEach(link => {
            html += `<tr>
                        <td>${link.name || "-"}</td>
                        <td><a href="${link.url}" target="_blank">${link.url}</a></td>
                        <td>${link.type}</td>
                     </tr>`;
        });
        html += "</tbody></table>";
        document.getElementById("links-content").innerHTML = html;
    } else {
        document.getElementById("links-content").innerHTML = "<p>No links found</p>";
    }

    // ---- Hook up download buttons ----
    if (data.downloads) {
        document.getElementById("download-emails").href = data.downloads.emails;
        document.getElementById("download-numbers").href = data.downloads.numbers;
        document.getElementById("download-links").href = data.downloads.links;
    }
});

// ✅ Toggle section visibility
function toggleContent(id) {
    const el = document.getElementById(id);
    el.style.display = (el.style.display === "none" || el.style.display === "") ? "block" : "none";
}

// ✅ Reset page
function resetPage() {
    document.getElementById("scraped-results").style.display = "none";
    document.getElementById("emails-content").innerHTML = "";
    document.getElementById("numbers-content").innerHTML = "";
    document.getElementById("links-content").innerHTML = "";
    document.getElementById("scrape-form").reset();
}
