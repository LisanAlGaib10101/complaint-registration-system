// Helper to get complaint data from LocalStorage
function getComplaints() {
    return JSON.parse(localStorage.getItem('complaints')) || [];
}

// Helper to save complaint data to LocalStorage
function saveComplaints(complaints) {
    localStorage.setItem('complaints', JSON.stringify(complaints));
}

// Handle form submission
document.getElementById("complaintForm").onsubmit = function(e) {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const department = document.getElementById("department").value;
    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;
    const time = new Date().toLocaleString();
    const complaints = getComplaints();

    complaints.push({
        name,
        department,
        title,
        description,
        time,
        status: "pending"
    });

    saveComplaints(complaints);
    renderComplaints();
    this.reset();
};

// Render complaints in the table
function renderComplaints(filterComplaints) {
    const complaints = filterComplaints || getComplaints();
    const tbody = document.querySelector("#complaintsTable tbody");
    tbody.innerHTML = "";

    complaints.forEach((complaint, idx) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td data-label="Name">${complaint.name}</td>
            <td data-label="Department">${complaint.department}</td>
            <td data-label="Title">${complaint.title}</td>
            <td data-label="Description">${complaint.description}</td>
            <td data-label="Time">${complaint.time || ''}</td>
            <td data-label="Status">${complaint.status}</td>
            <td data-label="Action">
                <button onclick="updateStatus(${idx})">
                    Mark as ${complaint.status === "pending" ? "resolved" : "pending"}
                </button>
                <button onclick="deleteComplaint(${idx})" style="margin-left: 5px; background-color: #e76f51;">
                    Delete
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

// Change status between pending and resolved
window.updateStatus = function(idx) {
    const complaints = getComplaints();
    complaints[idx].status = complaints[idx].status === "pending" ? "resolved" : "pending";
    saveComplaints(complaints);
    renderComplaints();
};

// Delete complaint by index
window.deleteComplaint = function(idx) {
    const complaints = getComplaints();
    complaints.splice(idx, 1);
    saveComplaints(complaints);
    renderComplaints();
};

// Search complaints by title/department/name
document.getElementById('searchInput').addEventListener('input', function() {
    const query = this.value.toLowerCase();
    const complaints = getComplaints();

    const filtered = complaints.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.department.toLowerCase().includes(query) ||
        c.title.toLowerCase().includes(query)
    );

    renderComplaints(filtered);
});

// Initial render on page load
renderComplaints();


row.innerHTML = `
    <td data-label="Name">${complaint.name}</td>
    <td data-label="Department">${complaint.department}</td>
    <td data-label="Title">${complaint.title}</td>
    <td data-label="Description">${complaint.description}</td>
    <td data-label="Time">${complaint.time || ''}</td>
    <td data-label="Status">${complaint.status}</td>
    <td data-label="Action">
        <button onclick="updateStatus(${idx})">
            Mark as ${complaint.status === "pending" ? "resolved" : "pending"}
        </button>
        <button onclick="deleteComplaint(${idx})" style="margin-left: 5px; background-color: #e76f51;">
            Delete
        </button>
    </td>
`;

