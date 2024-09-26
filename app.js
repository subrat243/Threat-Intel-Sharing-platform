// app.js

document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;
    const navbar = document.querySelector('.navbar');
    const footer = document.querySelector('footer');
    const connectWalletButton = document.getElementById('connectWalletButton');

    // State Variables
    let web3;
    let contract;
    let userAccount = null; // To store the connected account
    const contractAddress = 'YOUR_SMART_CONTRACT_ADDRESS'; // Replace with your contract address
    const contractABI = [ /* YOUR_CONTRACT_ABI */ ]; // Replace with your contract's ABI

    // Initialize Dark Mode based on saved preference
    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark-mode');
        darkModeToggle.textContent = '☀️ Light Mode';
    } else {
        darkModeToggle.textContent = '🌙 Dark Mode';
    }

    // Dark Mode Toggle Event
    darkModeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        navbar.classList.toggle('bg-primary');
        navbar.classList.toggle('bg-dark');
        footer.classList.toggle('bg-light');
        footer.classList.toggle('bg-dark');
        footer.classList.toggle('text-dark');
        footer.classList.toggle('text-white');

        if (body.classList.contains('dark-mode')) {
            darkModeToggle.textContent = '☀️ Light Mode';
            localStorage.setItem('theme', 'dark');
        } else {
            darkModeToggle.textContent = '🌙 Dark Mode';
            localStorage.setItem('theme', 'light');
        }
    });

    // Connect Wallet Button Click Event
    connectWalletButton.addEventListener('click', connectWallet);

    // Check if wallet is already connected
    checkIfWalletIsConnected();

    // Initialize Web3 and Smart Contract
    async function initWeb3() {
        if (window.ethereum) {
            web3 = new Web3(window.ethereum);
            try {
                // Initialize contract instance
                contract = new web3.eth.Contract(contractABI, contractAddress);
                console.log('Web3 and contract initialized.');
            } catch (error) {
                console.error('Error initializing contract:', error);
                showStatusModal('Error', 'Failed to initialize smart contract.', 'danger');
            }
        } else if (window.web3) {
            web3 = new Web3(window.web3.currentProvider);
            contract = new web3.eth.Contract(contractABI, contractAddress);
            console.log('Web3 injected browser.');
        } else {
            console.error('Non-Ethereum browser detected. You should consider trying MetaMask!');
            showStatusModal('Error', 'Non-Ethereum browser detected. Please install MetaMask!', 'danger');
        }
    }

    // Connect Wallet Function
    async function connectWallet() {
        if (window.ethereum) {
            try {
                // Request account access if needed
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                userAccount = accounts[0];
                console.log('Connected account:', userAccount);
                connectWalletButton.textContent = `Connected: ${shortenAddress(userAccount)}`;
                connectWalletButton.classList.remove('btn-success');
                connectWalletButton.classList.add('btn-secondary');

                // Initialize Web3 and contract after connecting
                await initWeb3();

                // Fetch and display threats after connecting
                fetchAndDisplayThreats();

                // Listen for account changes
                window.ethereum.on('accountsChanged', handleAccountsChanged);
            } catch (error) {
                console.error('User denied account access', error);
                showStatusModal('Error', 'User denied account access', 'danger');
            }
        } else {
            showStatusModal('Error', 'Non-Ethereum browser detected. Please install MetaMask!', 'danger');
        }
    }

    // Handle account changes
    function handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            // MetaMask is locked or the user has not connected any accounts
            console.log('Please connect to MetaMask.');
            showStatusModal('Info', 'Please connect to MetaMask.', 'info');
            userAccount = null;
            connectWalletButton.textContent = 'Connect Wallet';
            connectWalletButton.classList.remove('btn-secondary');
            connectWalletButton.classList.add('btn-success');
            // Optionally, clear threats list
            clearThreatsTable();
        } else {
            userAccount = accounts[0];
            connectWalletButton.textContent = `Connected: ${shortenAddress(userAccount)}`;
            console.log('Connected account changed to:', userAccount);
            // Refresh the threats list or perform other actions
            fetchAndDisplayThreats();
        }
    }

    // Utility function to shorten Ethereum address
    function shortenAddress(address) {
        return address.slice(0, 6) + '...' + address.slice(-4);
    }

    // Check if wallet is already connected on page load
    async function checkIfWalletIsConnected() {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    userAccount = accounts[0];
                    connectWalletButton.textContent = `Connected: ${shortenAddress(userAccount)}`;
                    connectWalletButton.classList.remove('btn-success');
                    connectWalletButton.classList.add('btn-secondary');
                    await initWeb3();
                    fetchAndDisplayThreats();
                    // Listen for account changes
                    window.ethereum.on('accountsChanged', handleAccountsChanged);
                }
            } catch (error) {
                console.error('Error checking wallet connection:', error);
            }
        }
    }

    // Submit Threat Intelligence
    document.getElementById('submitThreatForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!userAccount) {
            showStatusModal('Authentication Required', 'Please connect your wallet to submit a threat.', 'warning');
            return;
        }

        const ipAddress = document.getElementById('ipAddress').value.trim();
        const hash = document.getElementById('hash').value.trim();
        const description = document.getElementById('description').value.trim();

        // Simple validation
        if (!validateIPAddress(ipAddress)) {
            showStatusModal('Validation Error', 'Please enter a valid IP address.', 'warning');
            return;
        }

        // Show loading spinner
        document.getElementById('submitLoading').style.display = 'block';

        try {
            await contract.methods.submitThreat(ipAddress, hash, description).send({ from: userAccount });
            showStatusModal('Success', 'Threat submitted successfully!', 'success');
            document.getElementById('submitThreatForm').reset();
            // Refresh threats list
            fetchAndDisplayThreats();
        } catch (error) {
            console.error('Error submitting threat:', error);
            showStatusModal('Error', 'Failed to submit threat. Please try again.', 'danger');
        } finally {
            document.getElementById('submitLoading').style.display = 'none';
        }
    });

    // Validate IP Address
    function validateIPAddress(ip) {
        const regex = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
        return regex.test(ip);
    }

    // Verify Threat Intelligence
    document.getElementById('verifyThreatButton').addEventListener('click', async () => {
        if (!userAccount) {
            showStatusModal('Authentication Required', 'Please connect your wallet to verify a threat.', 'warning');
            return;
        }

        const threatId = document.getElementById('verifyThreatId').value.trim();

        if (threatId === '' || isNaN(threatId)) {
            showStatusModal('Validation Error', 'Please enter a valid Threat ID.', 'warning');
            return;
        }

        // Show loading spinner
        document.getElementById('verifyLoading').style.display = 'block';

        try {
            await contract.methods.verifyThreat(threatId).send({ from: userAccount });
            showStatusModal('Success', `Threat ID ${threatId} verified successfully!`, 'success');
            document.getElementById('verifyThreatId').value = '';
            // Refresh threats list
            fetchAndDisplayThreats();
        } catch (error) {
            console.error('Error verifying threat:', error);
            showStatusModal('Error', 'Failed to verify threat. Please try again.', 'danger');
        } finally {
            document.getElementById('verifyLoading').style.display = 'none';
        }
    });

    // Fetch and Display Threats with Search and Filters
    let currentPage = 1;
    const itemsPerPage = 10;
    let allThreats = [];

    document.getElementById('viewThreatsButton').addEventListener('click', fetchAndDisplayThreats);

    async function fetchAndDisplayThreats() {
        if (!contract) {
            showStatusModal('Error', 'Smart contract is not initialized.', 'danger');
            return;
        }

        // Show loading spinner
        document.getElementById('threatsBody').innerHTML = '';
        showLoadingTable(true);

        try {
            const threatsCount = await contract.methods.getThreatsCount().call();
            let threats = [];

            // Fetch threats in batches to optimize
            const batchSize = 50; // Adjust as needed
            for (let i = 0; i < threatsCount; i += batchSize) {
                const batchEnd = Math.min(i + batchSize, threatsCount);
                const batchPromises = [];

                for (let j = i; j < batchEnd; j++) {
                    batchPromises.push(contract.methods.threats(j).call());
                }

                const batchThreats = await Promise.all(batchPromises);
                threats = threats.concat(batchThreats);
            }

            allThreats = threats;
            applyFiltersAndDisplay();
        } catch (error) {
            console.error('Error fetching threats:', error);
            showStatusModal('Error', 'Failed to fetch threats. Please try again.', 'danger');
        } finally {
            showLoadingTable(false);
        }
    }

    function showLoadingTable(show) {
        const threatsBody = document.getElementById('threatsBody');
        threatsBody.innerHTML = show ? `<tr><td colspan="5" class="text-center">Loading...</td></tr>` : '';
    }

    function applyFiltersAndDisplay() {
        const searchQuery = document.getElementById('searchInput').value.toLowerCase();
        const filter = document.getElementById('filterVerified').value;

        let filteredThreats = allThreats.filter(threat => {
            const matchesSearch = threat.ipAddress.toLowerCase().includes(searchQuery) ||
                                  threat.hash.toLowerCase().includes(searchQuery) ||
                                  threat.description.toLowerCase().includes(searchQuery);
            const matchesFilter = filter === 'all' ||
                                  (filter === 'verified' && threat.verified) ||
                                  (filter === 'unverified' && !threat.verified);
            return matchesSearch && matchesFilter;
        });

        currentPage = 1; // Reset to first page on new filter/search
        displayThreats(filteredThreats);
        setupPagination(filteredThreats);
    }

    function displayThreats(threats) {
        const threatsBody = document.getElementById('threatsBody');
        threatsBody.innerHTML = '';

        if (threats.length === 0) {
            threatsBody.innerHTML = `<tr><td colspan="5" class="text-center">No threats found.</td></tr>`;
            return;
        }

        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedThreats = threats.slice(start, end);

        paginatedThreats.forEach((threat) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${parseInt(threat.id)}</td>
                <td>${threat.ipAddress}</td>
                <td>${threat.hash}</td>
                <td>${threat.description}</td>
                <td>${threat.verified ? '✅' : '❌'}</td>
            `;
            threatsBody.appendChild(row);
        });
    }

    function setupPagination(threats) {
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = '';

        const totalPages = Math.ceil(threats.length / itemsPerPage);
        if (totalPages <= 1) return;

        // Previous Button
        const prevLi = document.createElement('li');
        prevLi.classList.add('page-item', currentPage === 1 ? 'disabled' : '');
        prevLi.innerHTML = `<a class="page-link" href="#">Previous</a>`;
        prevLi.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage > 1) {
                currentPage--;
                displayThreats(threats);
                setupPagination(threats);
            }
        });
        pagination.appendChild(prevLi);

        // Page Numbers
        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement('li');
            li.classList.add('page-item', i === currentPage ? 'active' : '');
            li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            li.addEventListener('click', (e) => {
                e.preventDefault();
                currentPage = i;
                displayThreats(threats);
                setupPagination(threats);
            });
            pagination.appendChild(li);
        }

        // Next Button
        const nextLi = document.createElement('li');
        nextLi.classList.add('page-item', currentPage === totalPages ? 'disabled' : '');
        nextLi.innerHTML = `<a class="page-link" href="#">Next</a>`;
        nextLi.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage < totalPages) {
                currentPage++;
                displayThreats(threats);
                setupPagination(threats);
            }
        });
        pagination.appendChild(nextLi);
    }

    // Event listeners for search and filter
    document.getElementById('searchInput').addEventListener('input', applyFiltersAndDisplay);
    document.getElementById('filterVerified').addEventListener('change', applyFiltersAndDisplay);

    // Clear Threats Table
    function clearThreatsTable() {
        const threatsBody = document.getElementById('threatsBody');
        threatsBody.innerHTML = `<tr><td colspan="5" class="text-center">Please connect your wallet to view threats.</td></tr>`;
        document.getElementById('pagination').innerHTML = '';
    }

    // Show Status Modal
    function showStatusModal(title, message, type) {
        const statusModal = new bootstrap.Modal(document.getElementById('statusModal'));
        const statusModalHeader = document.getElementById('statusModalHeader');
        const statusModalLabel = document.getElementById('statusModalLabel');
        const statusModalBody = document.getElementById('statusModalBody');

        // Reset classes
        statusModalHeader.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'bg-info', 'bg-secondary');
        statusModalLabel.classList.remove('text-white');

        // Apply new classes based on type
        switch (type) {
            case 'success':
                statusModalHeader.classList.add('bg-success');
                statusModalLabel.classList.add('text-white');
                break;
            case 'danger':
                statusModalHeader.classList.add('bg-danger');
                statusModalLabel.classList.add('text-white');
                break;
            case 'warning':
                statusModalHeader.classList.add('bg-warning');
                break;
            case 'info':
                statusModalHeader.classList.add('bg-info');
                statusModalLabel.classList.add('text-white');
                break;
            case 'secondary':
                statusModalHeader.classList.add('bg-secondary');
                statusModalLabel.classList.add('text-white');
                break;
            default:
                statusModalHeader.classList.add('bg-secondary');
                statusModalLabel.classList.add('text-white');
        }

        statusModalLabel.textContent = title;
        statusModalBody.textContent = message;
        statusModal.show();
    }
});
