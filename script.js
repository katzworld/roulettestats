const API_URL = 'https://oracle.imamkatz.com/api/history';
const ENS_API_URL = 'https://api.ensideas.com/ens/resolve/';

// Cache for ENS data to avoid repeated API calls
const ensCache = new Map();
// Cache for player statistics
const playerStats = new Map();

async function fetchENSData(address) {
    if (ensCache.has(address)) {
        return ensCache.get(address);
    }
    try {
        const response = await fetch(ENS_API_URL + address);
        const data = await response.json();
        ensCache.set(address, data);
        return data;
    } catch (error) {
        console.error('Error fetching ENS data:', error);
        return null;
    }
}

async function fetchHistory() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        processPlayerStats(data);
        await displayUniqueProfiles(data);
        displayHistory(data);
    } catch (error) {
        console.error('Error fetching history:', error);
    }
}

function processPlayerStats(history) {
    playerStats.clear();
    
    history.forEach(item => {
        const bet = item.bets[0];
        const player = bet.player;
        
        if (!playerStats.has(player)) {
            playerStats.set(player, {
                totalBets: 0,
                wins: 0,
                losses: 0,
                totalSpent: 0
            });
        }
        
        const stats = playerStats.get(player);
        stats.totalBets++;
        stats.totalSpent += bet.amount;
        
        if (bet.winAmount > 0) {
            stats.wins++;
        } else {
            stats.losses++;
        }
    });
}

async function displayUniqueProfiles(history) {
    const uniquePlayers = new Set(history.map(item => item.bets[0].player));
    const profilesContainer = document.getElementById('profiles-container');
    profilesContainer.innerHTML = '<h2 class="text-xl font-bold mb-4">Recent Players</h2>';

    for (const player of uniquePlayers) {
        const stats = playerStats.get(player);
        const ensData = await fetchENSData(player);
        const displayName = ensData?.displayName || player.substring(0, 6) + '...' + player.substring(38);
        
        const profileCard = document.createElement('div');
        profileCard.className = 'bg-gray-700 rounded-lg p-4 mb-4 cursor-pointer hover:bg-gray-600 transition-colors';
        profileCard.onclick = () => displayPlayerStats(player);
        
        const winRate = ((stats.wins / stats.totalBets) * 100).toFixed(1);
        
        profileCard.innerHTML = `
            <div class="flex items-center gap-3">
                <img src="${ensData?.avatar || 'https://via.placeholder.com/40'}" 
                     alt="Player avatar" 
                     class="w-10 h-10 rounded-full"
                     onerror="this.src='https://via.placeholder.com/40'">
                <div class="flex-grow">
                    <p class="font-medium">${displayName}</p>
                    <div class="flex gap-2 text-sm text-gray-400">
                        <span>${stats.totalBets} bets</span>
                        <span>•</span>
                        <span>${winRate}% wins</span>
                    </div>
                </div>
            </div>
        `;
        
        profilesContainer.appendChild(profileCard);
    }
}

async function displayPlayerStats(player) {
    const stats = playerStats.get(player);
    const ensData = await fetchENSData(player);
    const displayName = ensData?.displayName || player.substring(0, 6) + '...' + player.substring(38);
    
    const statsContainer = document.getElementById('stats-container');
    statsContainer.innerHTML = `
        <div class="text-center mb-6">
            <img src="${ensData?.avatar || 'https://via.placeholder.com/80'}" 
                 alt="Player avatar" 
                 class="w-20 h-20 rounded-full mx-auto mb-4"
                 onerror="this.src='https://via.placeholder.com/80'">
            <h2 class="text-2xl font-bold mb-2">${displayName}</h2>
        </div>
        <div class="grid grid-cols-2 gap-4">
            <div class="bg-gray-700 rounded-lg p-4 text-center">
                <p class="text-sm text-gray-400">Total Bets</p>
                <p class="text-2xl font-bold">${stats.totalBets}</p>
            </div>
            <div class="bg-gray-700 rounded-lg p-4 text-center">
                <p class="text-sm text-gray-400">Total Spent</p>
                <p class="text-2xl font-bold">${stats.totalSpent}</p>
            </div>
            <div class="bg-green-900 rounded-lg p-4 text-center">
                <p class="text-sm text-gray-300">Wins</p>
                <p class="text-2xl font-bold">${stats.wins}</p>
            </div>
            <div class="bg-red-900 rounded-lg p-4 text-center">
                <p class="text-sm text-gray-300">Losses</p>
                <p class="text-2xl font-bold">${stats.losses}</p>
            </div>
        </div>
    `;
}

async function displayHistory(history) {
    const container = document.getElementById('history-container');
    container.innerHTML = '';

    for (const item of history) {
        const bet = item.bets[0];
        const isWin = bet.winAmount > 0;
        
        const ensData = await fetchENSData(bet.player);
        
        const historyItem = document.createElement('div');
        historyItem.className = `p-4 rounded-lg ${isWin ? 'bg-green-900' : 'bg-red-900'} history-item cursor-pointer`;
        historyItem.onclick = () => displayPlayerStats(bet.player);
        
        historyItem.innerHTML = `
            <div class="flex items-start gap-4">
                <div class="flex-shrink-0">
                    <img src="${ensData?.avatar || 'https://via.placeholder.com/40'}" 
                         alt="Player avatar" 
                         class="w-10 h-10 rounded-full"
                         onerror="this.src='https://via.placeholder.com/40'">
                </div>
                <div class="flex-grow">
                    <div class="flex justify-between items-center">
                        <div>
                            <p class="font-bold">Round #${item.round}</p>
                            <p class="text-sm text-gray-300">${new Date(item.timestamp).toLocaleString()}</p>
                        </div>
                        <div class="text-right">
                            <p class="font-bold">${bet.amount} → ${bet.winAmount}</p>
                            <p class="text-sm">Result: ${bet.spinResult}</p>
                        </div>
                    </div>
                    <div class="mt-2">
                        <p class="text-sm font-medium">
                            ${ensData?.displayName || bet.player.substring(0, 6) + '...' + bet.player.substring(38)}
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(historyItem);
    }
}

// Fetch history when page loads
document.addEventListener('DOMContentLoaded', fetchHistory);
