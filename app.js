// app.js

// Initialize Web3.js and set up contract interaction
let web3;
let contract;

// Replace with your deployed contract's address and ABI
const contractAddress = '0x0A2228e6537b0109B443A60166bFA9e57e264C56'; // TODO: Replace with your contract's address
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
        } catch (error) {
            console.error("User denied account access", error);
            alert("Please allow access to MetaMask to use this platform.");
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
        displayStatus("submitStatus", "All fields are required.", "error");
        return;
    }

    try {
        const accounts = await web3.eth.getAccounts();
        displayStatus("submitStatus", "Submitting threat...", "info");
        await contract.methods.submitThreat(ipAddress, hash, description).send({ from: accounts[0] });
        displayStatus("submitStatus", "Threat submitted successfully!", "success");
        document.getElementById("submitThreatForm").reset();
        loadThreats(); // Refresh threats list
    } catch (error) {
        console.error(error);
        displayStatus("submitStatus", "Error submitting threat. Please try again.", "error");
    }
});

// Verify Threat
document.getElementById("verifyThreatButton").addEventListener("click", async function () {
    const threatId = document.getElementById("verifyThreatId").value.trim();

    if (threatId === "") {
        displayStatus("verifyStatus", "Threat ID is required.", "error");
        return;
    }

    try {
        const accounts = await web3.eth.getAccounts();
        displayStatus("verifyStatus", "Verifying threat...", "info");
        await contract.methods.verifyThreat(threatId).send({ from: accounts[0] });
        displayStatus("verifyStatus", `Threat ID ${threatId} verified successfully!`, "success");
        loadThreats(); // Refresh threats list
    } catch (error) {
        console.error(error);
        displayStatus("verifyStatus", "Error verifying threat. Please try again.", "error");
    }
});

// View All Threats
document.getElementById("viewThreatsButton").addEventListener("click", loadThreats);

// Function to load and display threats
async function loadThreats() {
    try {
        const threats = await contract.methods.getThreats().call();
        const tableBody = document.getElementById("threatsBody");
        tableBody.innerHTML = ""; // Clear existing rows

        for (let i = 0; i < threats.length; i++) {
            const threat = threats[i];
            const isVerified = await contract.methods.verifiedThreats(threat.id).call();

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${threat.id}</td>
                <td>${threat.ipAddress}</td>
                <td>${threat.hash}</td>
                <td>${threat.description}</td>
                <td>${isVerified ? '<span class="badge bg-success">Yes</span>' : '<span class="badge bg-secondary">No</span>'}</td>
            `;
            tableBody.appendChild(row);
        }
    } catch (error) {
        console.error(error);
        alert("Error retrieving threats. Please try again.");
    }
}

// Function to display status messages
function displayStatus(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.className = ""; // Reset classes

    switch(type) {
        case "success":
            element.classList.add("success");
            break;
        case "error":
            element.classList.add("error");
            break;
        case "info":
            element.classList.add("info");
            break;
        default:
            break;
    }

    element.textContent = message;
}

// Initialize on page load
window.addEventListener("load", () => {
    initWeb3();
    loadThreats(); // Automatically load threats on page load
});
