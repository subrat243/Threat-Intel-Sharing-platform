// app.js

// Initialize Web3.js and set up contract interaction
let web3;
let contract;

// Replace with your deployed contract's address and ABI
const contractAddress = '0x717A1D0EEe419D58033807025C8921c89EC91060'; // TODO: Replace with your contract's address
const contractABI = [
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_ipAddress",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_hash",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_description",
				"type": "string"
			}
		],
		"name": "submitThreat",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "submitter",
				"type": "address"
			}
		],
		"name": "ThreatSubmitted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "verifier",
				"type": "address"
			}
		],
		"name": "ThreatVerified",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_threatId",
				"type": "uint256"
			}
		],
		"name": "verifyThreat",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getThreats",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "id",
						"type": "uint256"
					},
					{
						"internalType": "string",
						"name": "ipAddress",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "hash",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "description",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "timestamp",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "submitter",
						"type": "address"
					}
				],
				"internalType": "struct ThreatIntelligencePlatform.Threat[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "threats",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "ipAddress",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "hash",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "description",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "submitter",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "verifiedThreats",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]; // TODO: Replace with your contract's ABI

// Pagination variables
const threatsPerPage = 5;
let currentPage = 1;
let allThreats = [];

// Connect to MetaMask and initialize Web3
async function initWeb3() {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        try {
            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            // Initialize contract instance
            contract = new web3.eth.Contract(contractABI, contractAddress);
            console.log("Connected to MetaMask");
            loadThreats(); // Load threats on initialization
        } catch (error) {
            console.error("User denied account access", error);
            showModal("Access Denied", "Please allow access to MetaMask to use this platform.", "error");
        }
    } else {
        alert("MetaMask not detected. Please install MetaMask.");
    }
}

// Submit Threat Intelligence
document.getElementById("submitThreatForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const ipAddress = document.getElementById("ipAddress").value.trim();
    const hash = document.getElementById("hash").value.trim();
    const description = document.getElementById("description").value.trim();

    if (!ipAddress || !hash || !description) {
        showModal("Input Error", "All fields are required.", "error");
        return;
    }

    try {
        const accounts = await web3.eth.getAccounts();
        // Show loading spinner
        document.getElementById("submitLoading").style.display = "inline-block";
        // Submit threat
        await contract.methods.submitThreat(ipAddress, hash, description).send({ from: accounts[0] });
        // Hide loading spinner
        document.getElementById("submitLoading").style.display = "none";
        showModal("Success", "Threat submitted successfully!", "success");
        document.getElementById("submitThreatForm").reset();
        loadThreats(); // Refresh threats list
    } catch (error) {
        console.error(error);
        document.getElementById("submitLoading").style.display = "none";
        showModal("Submission Error", "Error submitting threat. Please try again.", "error");
    }
});

// Verify Threat
document.getElementById("verifyThreatButton").addEventListener("click", async function () {
    const threatId = document.getElementById("verifyThreatId").value.trim();

    if (threatId === "") {
        showModal("Input Error", "Threat ID is required.", "error");
        return;
    }

    try {
        const accounts = await web3.eth.getAccounts();
        // Show loading spinner
        document.getElementById("verifyLoading").style.display = "inline-block";
        // Verify threat
        await contract.methods.verifyThreat(threatId).send({ from: accounts[0] });
        // Hide loading spinner
        document.getElementById("verifyLoading").style.display = "none";
        showModal("Success", `Threat ID ${threatId} verified successfully!`, "success");
        document.getElementById("verifyThreatId").value = '';
        loadThreats(); // Refresh threats list
    } catch (error) {
        console.error(error);
        document.getElementById("verifyLoading").style.display = "none";
        showModal("Verification Error", "Error verifying threat. Please try again.", "error");
    }
});

// View All Threats Button
document.getElementById("viewThreatsButton").addEventListener("click", function () {
    currentPage = 1; // Reset to first page
    displayThreats();
});

// Search and Filter Functionality
document.getElementById("searchInput").addEventListener("input", function () {
    currentPage = 1; // Reset to first page
    displayThreats();
});

document.getElementById("filterVerified").addEventListener("change", function () {
    currentPage = 1; // Reset to first page
    displayThreats();
});

// Load Threats from Smart Contract
async function loadThreats() {
    try {
        const threats = await contract.methods.getThreats().call();
        const verifiedStatuses = await Promise.all(threats.map(threat => contract.methods.verifiedThreats(threat.id).call()));
        // Combine threats with their verification status
        allThreats = threats.map((threat, index) => ({
            id: threat.id,
            ipAddress: threat.ipAddress,
            hash: threat.hash,
            description: threat.description,
            timestamp: threat.timestamp,
            submitter: threat.submitter,
            verified: verifiedStatuses[index]
        }));
        displayThreats();
    } catch (error) {
        console.error(error);
        showModal("Loading Error", "Error retrieving threats. Please try again.", "error");
    }
}

// Display Threats with Pagination, Search, and Filters
function displayThreats() {
    const searchQuery = document.getElementById("searchInput").value.toLowerCase();
    const filterVerified = document.getElementById("filterVerified").value;

    // Filter threats based on search query and verification status
    let filteredThreats = allThreats.filter(threat => {
        const matchesSearch = threat.ipAddress.toLowerCase().includes(searchQuery) ||
                              threat.hash.toLowerCase().includes(searchQuery) ||
                              threat.description.toLowerCase().includes(searchQuery);
        let matchesFilter = true;
        if (filterVerified === "verified") {
            matchesFilter = threat.verified;
        } else if (filterVerified === "unverified") {
            matchesFilter = !threat.verified;
        }
        return matchesSearch && matchesFilter;
    });

    // Calculate pagination
    const totalThreats = filteredThreats.length;
    const totalPages = Math.ceil(totalThreats / threatsPerPage);
    const startIndex = (currentPage - 1) * threatsPerPage;
    const endIndex = startIndex + threatsPerPage;
    const threatsToDisplay = filteredThreats.slice(startIndex, endIndex);

    // Update threats table
    const tableBody = document.getElementById("threatsBody");
    tableBody.innerHTML = ""; // Clear existing rows

    threatsToDisplay.forEach(threat => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${threat.id}</td>
            <td>${threat.ipAddress}</td>
            <td>${threat.hash}</td>
            <td>${threat.description}</td>
            <td>${threat.verified ? '<span class="badge bg-success">Yes</span>' : '<span class="badge bg-secondary">No</span>'}</td>
        `;
        tableBody.appendChild(row);
    });

    // Update pagination
    updatePagination(totalPages);
}

// Update Pagination Controls
function updatePagination(totalPages) {
    const pagination = document.getElementById("pagination");
    pagination.innerHTML = ""; // Clear existing pagination

    // Previous Button
    const prevLi = document.createElement("li");
    prevLi.classList.add("page-item", currentPage === 1 ? "disabled" : "");
    prevLi.innerHTML = `
        <a class="page-link" href="#" aria-label="Previous">
            <span aria-hidden="true">&laquo;</span>
        </a>
    `;
    prevLi.addEventListener("click", function (e) {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            displayThreats();
        }
    });
    pagination.appendChild(prevLi);

    // Page Numbers
    for (let i = 1; i <= totalPages; i++) {
        const pageLi = document.createElement("li");
        pageLi.classList.add("page-item", currentPage === i ? "active" : "");
        pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        pageLi.addEventListener("click", function (e) {
            e.preventDefault();
            currentPage = i;
            displayThreats();
        });
        pagination.appendChild(pageLi);
    }

    // Next Button
    const nextLi = document.createElement("li");
    nextLi.classList.add("page-item", currentPage === totalPages || totalPages === 0 ? "disabled" : "");
    nextLi.innerHTML = `
        <a class="page-link" href="#" aria-label="Next">
            <span aria-hidden="true">&raquo;</span>
        </a>
    `;
    nextLi.addEventListener("click", function (e) {
        e.preventDefault();
        if (currentPage < totalPages) {
            currentPage++;
            displayThreats();
        }
    });
    pagination.appendChild(nextLi);
}

// Function to show Bootstrap Modal for Status Messages
function showModal(title, message, type) {
    const modalHeader = document.getElementById("statusModalHeader");
    const modalTitle = document.getElementById("statusModalLabel");
    const modalBody = document.getElementById("statusModalBody");

    // Set title and message
    modalTitle.textContent = title;
    modalBody.textContent = message;

    // Set header color based on type
    modalHeader.className = "modal-header"; // Reset classes
    if (type === "success") {
        modalHeader.classList.add("bg-success", "text-white");
    } else if (type === "error") {
        modalHeader.classList.add("bg-danger", "text-white");
    } else if (type === "info") {
        modalHeader.classList.add("bg-info", "text-dark");
    }

    // Show modal
    const statusModal = new bootstrap.Modal(document.getElementById('statusModal'));
    statusModal.show();
}

// Dark Mode Toggle
document.getElementById("darkModeToggle").addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");
    const isDarkMode = document.body.classList.contains("dark-mode");
    this.textContent = isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode";
});

// CSS for Dark Mode
const darkModeStyles = `
    body.dark-mode {
        background-color: #121212;
        color: #e0e0e0;
    }
    .card.dark-mode {
        background-color: #1e1e1e;
        color: #e0e0e0;
    }
    .navbar.dark-mode {
        background-color: #1e1e1e !important;
    }
    .table-dark .table-dark {
        background-color: #333;
    }
    footer.dark-mode {
        background-color: #1e1e1e;
        color: #e0e0e0;
    }
`;

// Inject Dark Mode Styles
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = darkModeStyles;
document.head.appendChild(styleSheet);
