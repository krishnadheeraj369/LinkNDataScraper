document.getElementById('scrape-form').onsubmit = function(event) {
    event.preventDefault(); // Prevent the default form submission

    var url = document.querySelector('.url-input').value;

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/scrape', true);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    
    // Handle the response from the server
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                var response = JSON.parse(xhr.responseText);
                showScrapedResults(response); // Show the download links
                alert('The website was successfully scraped!');
            } else {
                try {
                    var errorResponse = JSON.parse(xhr.responseText);
                    alert(errorResponse.error); // Shows the error message from the server
                } catch(e) {
                    alert('An unexpected error occurred.');
                }
            }
        }
    };

    // Send the URL as a JSON payload
    xhr.send(JSON.stringify({ url: url }));
};

// Display the download buttons and set download links
function showScrapedResults(downloadLinks) {
    document.getElementById('scraped-results').style.display = 'block';

    // Update download links for emails, numbers, and links
    document.getElementById('download-emails').href = downloadLinks.emails;
    document.getElementById('download-numbers').href = downloadLinks.numbers;
    document.getElementById('download-links').href = downloadLinks.links;

    // Example table rendering
    fetchAndDisplayTable('emails.csv', 'emails-content');
    fetchAndDisplayTable('numbers.csv', 'numbers-content');
    fetchAndDisplayTable('page_links.csv', 'links-content');
}

// Function to fetch and display scraped data in table format
function fetchAndDisplayTable(filename, elementId) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/static/' + filename, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var rows = xhr.responseText.split('\\n').map(row => row.split(','));  // Split into rows and columns
            var table = '<table><tr><th>Link Name</th><th>URL</th><th>Internal/External</th></tr>'; // Define headers
            rows.forEach(function (row) {
                if (row.length > 1) { // Check to avoid empty rows
                    table += '<tr>';
                    row.forEach(function (cell) {
                        table += `<td>${cell}</td>`;
                    });
                    table += '</tr>';
                }
            });
            table += '</table>';
            document.getElementById(elementId).innerHTML = table;
        } else if (xhr.readyState === 4 && xhr.status !== 200) {
            document.getElementById(elementId).textContent = 'Error loading data.';
        }
    };
    xhr.send();
}

// Toggle content visibility
function toggleContent(elementId) {
    var contentElement = document.getElementById(elementId);
    if (contentElement.style.display === 'none' || contentElement.style.display === '') {
        contentElement.style.display = 'block';
    } else {
        contentElement.style.display = 'none';
    }
}

// Reset the page to its initial state
function resetPage() {
    document.getElementById('scrape-form').reset();
    document.getElementById('scraped-results').style.display = 'none';
    document.getElementById('emails-content').style.display = 'none'; // Hide content
    document.getElementById('numbers-content').style.display = 'none'; // Hide content
    document.getElementById('links-content').style.display = 'none'; // Hide content
}
