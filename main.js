import { initializeApp } from "https://www.gstatic.com/firebasejs/9.9.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, orderBy, limit, query } from "https://www.gstatic.com/firebasejs/9.9.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAnL2LJhni_OwLEo8avKhGRv6AqEdRsZh0",
    authDomain: "theideahunt-74cd8.firebaseapp.com",
    projectId: "theideahunt-74cd8",
    storageBucket: "theideahunt-74cd8.appspot.com",
    messagingSenderId: "302655072510",
    appId: "1:302655072510:web:b66f02fe0862dbeae89daf",
    measurementId: "G-VW3BXP51Y1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let houses = [];
let currentIndex1 = 0;
let currentIndex2 = 1;

// Load the houses from the database
async function loadHouses() {
    try {
        const querySnapshot = await getDocs(collection(db, "houses"));
        houses = [];
        querySnapshot.forEach((doc) => {
            houses.push({ ...doc.data(), id: doc.id });
        });
        console.log('Houses loaded:', houses);
        displayHouses();
    } catch (error) {
        console.error('Error loading houses:', error);
    }
}

// Get a random index for selecting houses to vote on
function getRandomIndex(excludeIndex) {
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * houses.length);
    } while (randomIndex === excludeIndex);
    return randomIndex;
}

function showHeartAnimation(houseElement) {
    const heart = document.createElement('div');
    heart.className = 'heart-animation';
    heart.innerHTML = '❤️';

    // Position the heart over the clicked house
    const rect = houseElement.getBoundingClientRect();
    heart.style.left = `${rect.left + rect.width / 2}px`;
    heart.style.top = `${rect.top + rect.height / 2}px`;

    document.body.appendChild(heart);

    // Trigger animation and remove the heart after animation ends
    setTimeout(() => {
        heart.classList.add('animate');
    }, 10);

    setTimeout(() => {
        heart.remove();
    }, 1000); // Duration for heart to disappear
}

// Display the selected houses for voting with recency bias less than 5 matches
function displayHouses() {
    if (houses.length > 1) {
        currentIndex1 = getRandomIndex(null);
        currentIndex2 = getRandomIndex(currentIndex1);
        document.getElementById('house1').querySelector('img').src = houses[currentIndex1].url; // Change to load image URL
        document.getElementById('house2').querySelector('img').src = houses[currentIndex2].url; // Change to load image URL
    } else {
        console.error('Not enough houses to display.');
    }
}

// Calculate the Elo rating
function calculateElo(currentRating, opponentRating, actualScore, kFactor = 32) {
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - currentRating) / 400));
    return currentRating + kFactor * (actualScore - expectedScore);
}

// Handle the Skip action
function skipHouse() {
    // Simply call the displayHouses function to skip the current pair and load a new one
    displayHouses();
}

// Handle voting and updating ratings
async function vote(chosenHouse) {
    let winnerIndex, loserIndex;

    const houseElement = document.getElementById(chosenHouse);

    // Show the heart animation
    showHeartAnimation(houseElement);

    if (chosenHouse === 'house1') {
        winnerIndex = currentIndex1;
        loserIndex = currentIndex2;
    } else {
        winnerIndex = currentIndex2;
        loserIndex = currentIndex1;
    }

    const winnerRating = houses[winnerIndex].rating || 1200;
    const loserRating = houses[loserIndex].rating || 1200;

    const newWinnerRating = calculateElo(winnerRating, loserRating, 1);
    const newLoserRating = calculateElo(loserRating, winnerRating, 0);

    try {
        const winnerDocRef = doc(db, "houses", houses[winnerIndex].id);
        const loserDocRef = doc(db, "houses", houses[loserIndex].id);

        await updateDoc(winnerDocRef, { rating: newWinnerRating });
        await updateDoc(loserDocRef, { rating: newLoserRating });

        console.log(`Updated ratings: ${houses[winnerIndex].url} -> ${newWinnerRating}, ${houses[loserIndex].url} -> ${newLoserRating}`);

    } catch (error) {
        console.error("Error updating ratings: ", error);
    }

    currentIndex1 = getRandomIndex(loserIndex);
    currentIndex2 = getRandomIndex(currentIndex1);
    displayHouses();
}

function handleScroll() {
    const leaderboard = document.getElementById('leaderboard');
    if (window.scrollY > 100 && leaderboard.classList.contains('expanded')) {
        leaderboard.classList.remove('expanded');
        document.querySelectorAll('.leaderboard-entry').forEach(entry => {
            entry.style.display = 'none'; // Hide all leaderboard entries when collapsing
        });
    }
}

function toggleLeaderboardExpanded() {
    const leaderboard = document.getElementById('leaderboard');
    leaderboard.classList.toggle('expanded'); // Toggle the 'expanded' class

    // If it's expanded, show all entries, otherwise collapse them
    if (leaderboard.classList.contains('expanded')) {
        document.querySelectorAll('.leaderboard-entry').forEach(entry => {
            entry.style.display = 'block'; // Show all leaderboard entries
        });
    } else {
        document.querySelectorAll('.leaderboard-entry').forEach(entry => {
            entry.style.display = 'none'; // Hide leaderboard entries when collapsed
        });
    }
}

// Load and display the leaderboard
async function loadLeaderboard() {
    try {
        const q = query(collection(db, "houses"), orderBy("rating", "desc"), limit(10));
        const querySnapshot = await getDocs(q);

        const leaderboardContainer = document.getElementById('leaderboard-entries');
        leaderboardContainer.innerHTML = '';

        let position = 1;

        querySnapshot.forEach((doc) => {
            const houseData = doc.data();
            const submitterName = houseData.name || "Anonymous"; // Use "Anonymous" if no name provided

            const entryDiv = document.createElement('div');
            entryDiv.className = 'leaderboard-entry';
            entryDiv.onclick = () => toggleHouseDetails(entryDiv);

            entryDiv.innerHTML = `
                <span class="house-position">${position}.</span>
                <img src="${houseData.url}" alt="House Image" />
                <span class="house-author" style="font-style: italic; margin-left: 10px;">- ${submitterName}</span>
                <div class="house-details" style="display: none;">
                    <p>House rating: ${houseData.rating}</p>
                </div>
            `;

            leaderboardContainer.appendChild(entryDiv);

            position++;
        });
    } catch (error) {
        console.error('Error loading leaderboard:', error);
    }
}

// Toggle the details of each house in the leaderboard
function toggleHouseDetails(entryDiv) {
    const detailsDiv = entryDiv.querySelector('.house-details');
    detailsDiv.style.display = detailsDiv.style.display === 'none' ? 'block' : 'none';
}

// Attach the click event to the leaderboard title
document.querySelector('.leaderboard-header').addEventListener('click', toggleLeaderboardExpanded);

// Expose the functions to the global scope
window.vote = vote;
window.skipHouse = skipHouse;
window.addEventListener('scroll', handleScroll);

// Ensure both loadHouses and loadLeaderboard are called when the page loads
window.onload = () => {
    loadHouses();
    loadLeaderboard();
};