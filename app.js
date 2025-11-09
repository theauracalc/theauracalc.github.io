    // Supabase Configuration
    const SUPABASE_URL = 'https://sxhsqkyhflepeaexvqmh.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4aHNxa3loZmxlcGVhZXh2cW1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NTUxNDMsImV4cCI6MjA3ODAzMTE0M30.s2EmGHQr8Ijrs71VHIlEXzagJrUDvOC4y-hY0wOkP0A';

    // Initialize Supabase client
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // State
    let allPeople = [];
    let filteredPeople = [];
    let sortOrder = 'asc'; // 'asc' or 'desc'
    let currentFilter = { letter: '', score: '', search: '' };
    let isAdmin = false;
    let editingPersonId = null;
    let isInitialized = false; // Prevent multiple initializations
    let allNews = []; // Breaking news items
    let currentUser = null; // Current authenticated user
    let userVotes = {}; // Map of person_id -> vote_type for current user
    let lastNewsCheck = null; // Track last news check for notifications
    let newsCheckInterval = null; // Interval for checking new news
    let chatSubscription = null; // Real-time chat subscription
    let chatCleanupInterval = null; // Interval for cleaning up old messages
let lastChatMessageCount = 0; // Track message count to avoid unnecessary re-renders
let lastChatMessageIds = new Set(); // Track message IDs to detect new messages
let userVotesRefreshInterval = null; // Interval for refreshing user votes (to check daily reset at 9:30 PM France time)

// Admin User ID - Get this from Supabase Auth after creating your admin account
    // Go to Supabase Dashboard → Authentication → Users → Copy your User ID
    // ⚠️ IMPORTANT: Replace this with your actual User ID!
    const ADMIN_USER_ID = '50351ca7-3c14-4095-99a9-e6cbb4e6482a'; // Set this to your User ID from Supabase Auth

    // Security Note: Using Supabase Auth instead of plain password
    // This is much more secure as authentication is handled server-side

    // DOM Elements
    const peopleList = document.getElementById('peopleList');
    const searchInput = document.getElementById('searchInput');
    const letterFilter = document.getElementById('letterFilter');
    const scoreFilter = document.getElementById('scoreFilter');
    const sortBtn = document.getElementById('sortBtn');
    const totalCount = document.getElementById('totalCount');
    const avgScore = document.getElementById('avgScore');
    const highestScore = document.getElementById('highestScore');
    const adminBtn = document.getElementById('adminBtn');
    const userAuthBtn = document.getElementById('userAuthBtn');
    const adminControls = document.getElementById('adminControls');
    const loginModal = document.getElementById('loginModal');
    const userAuthModal = document.getElementById('userAuthModal');
    const editModal = document.getElementById('editModal');
    const newsModal = document.getElementById('newsModal');
    const loginForm = document.getElementById('loginForm');
    const userLoginForm = document.getElementById('userLoginForm');
    const userSignupForm = document.getElementById('userSignupForm');
    const personForm = document.getElementById('personForm');
    const newsForm = document.getElementById('newsForm');
    const newsTicker = document.getElementById('newsTicker');
    const newsList = document.getElementById('newsList');
    const newsTickerContainer = document.getElementById('newsTickerContainer');
    const featuredUsers = document.getElementById('featuredUsers');
    const trendingUsers = document.getElementById('trendingUsers');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    const usernameModal = document.getElementById('usernameModal');
    const usernameForm = document.getElementById('usernameForm');
    let userUsername = null; // Store current user's username

    // Initial data (fallback if Supabase is not configured)
    const initialData = [
        { name: 'Patato', score: 250 },
        { name: 'K', score: 240 },
        { name: 'Ami', score: 250 },
        { name: 'Mushroom', score: 120 },
        { name: 'Olvr', score: 295 },
        { name: 'Jin', score: 450 },
        { name: 'Yato', score: 480 },
        { name: 'Heeve', score: 260 },
        { name: 'Schrodinger', score: 290 },
        { name: 'Ren', score: 450 },
        { name: 'Yuta', score: 380 },
        { name: 'Bang Si', score: 160 },
        { name: 'Felecia', score: 130 },
        { name: 'Catch My Fade', score: 450 },
        { name: 'Nona', score: 280 },
        { name: 'Siri', score: 460 },
        { name: 'Addi', score: 330 },
        { name: 'Purr', score: 43 },
        { name: 'Buttercup', score: 200 },
        { name: 'Good Clown', score: 200 },
        { name: 'Gelii', score: 320 },
        { name: 'Kate', score: 420 },
        { name: 'Alex', score: 300 },
        { name: 'Wine', score: 350 },
        { name: 'Deo', score: 400 },
        { name: 'Tequila', score: 280 },
        { name: 'Belle', score: 200 },
        { name: 'Veronica', score: 300 },
        { name: 'Ligaya', score: 30 },
        { name: 'Maeve', score: 65 },
        { name: 'Popsmoke', score: 180 },
        { name: 'Doctor', score: 142 },
        { name: 'Beau', score: 240 },
        { name: 'M', score: 280 },
        { name: 'Kiana', score: 70 },
        { name: 'Demeter', score: 195 },
        { name: 'Elena', score: 120 },
        { name: 'Owwraytttt', score: 170 },
        { name: 'Uncle.yur', score: 30 },
        { name: 'Bobby', score: 350 },
        { name: 'Aqui', score: 450 },
        { name: 'Hoshi', score: 130 },
        { name: 'Tora', score: -100 },
        { name: 'Toe Sniffer', score: -20 },
        { name: 'Alexis', score: 140 },
        { name: 'Ursus', score: 70 },
        { name: 'Rick', score: 170 },
        { name: 'Pork Chops', score: 40 },
        { name: 'Jeanpaulgualtier', score: 67 },
        { name: 'Janice', score: -60 },
        { name: 'Zaine', score: 176 },
        { name: 'Thaven', score: 119 },
        { name: 'Kae', score: 138 },
        { name: 'Mica', score: 144 },
        { name: 'Omuamua', score: 151 },
        { name: 'Aint Inno', score: 182 },
        { name: 'Rof', score: 199 },
        { name: 'Meep', score: 160 },
        { name: 'Bumblebee', score: 121 },
        { name: 'Sia', score: 175 },
        { name: 'Robert', score: 142 },
        { name: 'Light', score: 108 },
        { name: 'Volker', score: 189 },
        { name: 'Pat', score: 134 },
        { name: 'Nyx', score: 178 },
        { name: 'Z (male)', score: 166 },
        { name: 'Dosii', score: 149 }
    ];

    // Initialize
    async function init() {
        // Prevent multiple initializations
        if (isInitialized) {
            console.warn('Already initialized, skipping...');
            return;
        }
        isInitialized = true;
        
        // Check user authentication status
        await checkUserAuth();
        
        // Check admin status from Supabase Auth
        await checkAdminStatus();
        
        // Check if Supabase is configured
        if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
            console.warn('Supabase not configured. Using local data. See SETUP.md for instructions.');
            allPeople = initialData;
            filterPeople();
            setupEventListeners();
            return;
        }

        try {
            await loadPeople();
            await loadNews();
            if (currentUser) {
                await loadUserVotes();
            }
            
            // Load trending users
            await loadTrendingUsers();
            
            // Start news notifications
            startNewsNotifications();
            
            // Load chat and set up real-time
            await loadChatMessages(true); // Force initial render
            setupChatRealtime();
            startChatCleanup();
            
            // Start polling as backup (will work even if real-time fails)
            startChatPolling();
            
            // Start periodic refresh of user votes to check 24-hour cooldown
            if (currentUser) {
                startUserVotesRefresh();
            }
        } catch (error) {
            console.error('Error initializing:', error);
            // Fallback to local data
            allPeople = initialData;
            filterPeople();
        }
        
        setupEventListeners();
    }

    // Load people from Supabase and calculate scores from votes
    async function loadPeople() {
        try {
            const { data, error } = await supabase
                .from('people')
                .select('*')
                .eq('approved', true)
                .order('name', { ascending: true });

            if (error) throw error;

            if (data && data.length > 0) {
                // Calculate scores from votes
                const peopleWithScores = await Promise.all(data.map(async (p) => {
                    const score = await calculateScoreFromVotes(p.id);
                    return { id: p.id, name: p.name, score: score };
                }));
                allPeople = peopleWithScores;
            } else {
                // If no data, use initial data
                allPeople = initialData;
            }

            filterPeople();
            await loadFeaturedUsers(); // Load featured users after loading all people
        } catch (error) {
            console.error('Error loading people:', error);
            throw error;
        }
    }

    // Calculate score from votes using a fair formula
    // Formula considers both approval ratio and total votes for fairness
    // Only counts the most recent vote per user (allows 24-hour voting reset)
    async function calculateScoreFromVotes(personId) {
        try {
            const { data: votes, error } = await supabase
                .from('votes')
                .select('vote_type, user_id, created_at')
                .eq('person_id', personId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Base score is 150 - everyone starts here
            const BASE_SCORE = 150;
            
            if (!votes || votes.length === 0) {
                // If no votes, return base score of 150
                return BASE_SCORE;
            }

            // Get only the most recent vote per user (to handle 24-hour voting reset)
            const mostRecentVotesByUser = {};
            votes.forEach(vote => {
                if (!mostRecentVotesByUser[vote.user_id]) {
                    mostRecentVotesByUser[vote.user_id] = vote;
                }
            });

            // Count upvotes and downvotes from most recent votes only
            let upvotes = 0;
            let downvotes = 0;
            Object.values(mostRecentVotesByUser).forEach(vote => {
                if (vote.vote_type === 'up') {
                    upvotes += 1;
                } else if (vote.vote_type === 'down') {
                    downvotes += 1;
                }
            });

            const totalVotes = upvotes + downvotes;
            
            // Fair scoring formula that allows scores to go below 150 with downvotes
            // Uses net votes directly so downvotes can reduce score below base
            
            const netVotes = upvotes - downvotes;
            
            // Use approval ratio only for positive scores (to reward high approval)
            // For negative net votes, use them directly so downvotes work
            let scoreChange;
            
            if (netVotes >= 0) {
                // Positive or neutral: use approval ratio to reward high approval percentage
                const approvalRatio = totalVotes > 0 ? upvotes / totalVotes : 0.5;
                const confidenceFactor = Math.min(2.0, Math.sqrt(totalVotes) / 2);
                scoreChange = Math.round(netVotes * approvalRatio * confidenceFactor * 8);
            } else {
                // Negative: use net votes directly so downvotes can reduce score below 150
                // Apply confidence factor but don't use approval ratio (which would be 0)
                const confidenceFactor = Math.min(2.0, Math.sqrt(totalVotes) / 2);
                // For downvotes, we want them to have impact, so use a multiplier
                // This allows scores to go below 150 and even below 0
                scoreChange = Math.round(netVotes * confidenceFactor * 8);
            }
            
            // Add base score (150) to the vote-based change
            // This allows scores to go below zero if there are enough downvotes
            const finalScore = BASE_SCORE + scoreChange;
            
            return finalScore;
        } catch (error) {
            console.error('Error calculating score:', error);
            return 150; // Return base score on error
        }
    }

    // Get upvote count for a person (only counts most recent vote per user)
    async function getUpvoteCount(personId) {
        // If no personId (e.g., from initialData fallback), return 0
        if (!personId) return 0;
        
        try {
            const { data: votes, error } = await supabase
                .from('votes')
                .select('vote_type, user_id, created_at')
                .eq('person_id', personId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            if (!votes || votes.length === 0) return 0;
            
            // Get only the most recent vote per user
            const mostRecentVotesByUser = {};
            votes.forEach(vote => {
                if (!mostRecentVotesByUser[vote.user_id]) {
                    mostRecentVotesByUser[vote.user_id] = vote;
                }
            });
            
            // Count only upvotes from most recent votes
            let upvoteCount = 0;
            Object.values(mostRecentVotesByUser).forEach(vote => {
                if (vote.vote_type === 'up') {
                    upvoteCount += 1;
                }
            });
            
            return upvoteCount;
        } catch (error) {
            console.error('Error getting upvote count:', error);
            return 0;
        }
    }

    // Get recent votes count for a person (last 24 hours)
    async function getRecentVotesCount(personId, hours = 24) {
        if (!personId) return 0;
        
        try {
            const hoursAgo = new Date();
            hoursAgo.setHours(hoursAgo.getHours() - hours);
            
            const { data: votes, error } = await supabase
                .from('votes')
                .select('vote_type, created_at')
                .eq('person_id', personId)
                .gte('created_at', hoursAgo.toISOString());

            if (error) throw error;
            return votes ? votes.length : 0;
        } catch (error) {
            console.error('Error getting recent votes count:', error);
            return 0;
        }
    }

    // Load and render trending users (people with recent votes)
    async function loadTrendingUsers() {
        if (!trendingUsers) return;

        try {
            // Filter out people without IDs
            const peopleWithIds = allPeople.filter(p => p.id);
            
            if (peopleWithIds.length === 0) {
                trendingUsers.innerHTML = '<div class="no-trending">No trending users yet. Start voting!</div>';
                return;
            }

            // Get people with recent vote counts (last 24 hours)
            const peopleWithRecentVotes = await Promise.all(
                peopleWithIds.map(async (person) => {
                    const recentVotes = await getRecentVotesCount(person.id, 24);
                    return { ...person, recentVotes };
                })
            );

            // Sort by recent votes (descending) and take top 5
            const topTrending = peopleWithRecentVotes
                .sort((a, b) => b.recentVotes - a.recentVotes)
                .slice(0, 5)
                .filter(p => p.recentVotes > 0); // Only show if they have recent votes

            renderTrendingUsers(topTrending);
        } catch (error) {
            console.error('Error loading trending users:', error);
            if (trendingUsers) {
                trendingUsers.innerHTML = '<div class="no-trending">No trending users yet. Start voting!</div>';
            }
        }
    }

    // Render trending users
    function renderTrendingUsers(trending) {
        if (!trendingUsers) return;

        if (trending.length === 0) {
            trendingUsers.innerHTML = '<div class="no-trending">No trending users yet. Start voting!</div>';
            return;
        }

        trendingUsers.innerHTML = trending.map((person, index) => `
            <div class="trending-user-card">
                <div class="trending-rank">#${index + 1}</div>
                <div class="trending-user-info">
                    <div class="trending-user-name">${escapeHtml(person.name)}</div>
                    <div class="trending-user-stats">
                        <span class="trending-votes">${person.recentVotes} vote${person.recentVotes !== 1 ? 's' : ''} in last 24h</span>
                        <span class="trending-score">Score: ${person.score > 0 ? '+' : ''}${person.score}</span>
                    </div>
                </div>
                <div class="trending-fire">🔥</div>
            </div>
        `).join('');
    }

    // Load and render featured users (top 3 by upvotes)
    async function loadFeaturedUsers() {
        if (!featuredUsers) return;

        try {
            // Filter out people without IDs (from initialData fallback)
            // Only process people that have IDs (from Supabase)
            const peopleWithIds = allPeople.filter(p => p.id);
            
            if (peopleWithIds.length === 0) {
                featuredUsers.innerHTML = '<div class="no-featured">No featured users yet. Start voting!</div>';
                return;
            }

            // Get all people with their upvote counts
            const peopleWithUpvotes = await Promise.all(
                peopleWithIds.map(async (person) => {
                    const upvotes = await getUpvoteCount(person.id);
                    return { ...person, upvotes };
                })
            );

            // Sort by upvotes (descending) and take top 3
            const top3 = peopleWithUpvotes
                .sort((a, b) => b.upvotes - a.upvotes)
                .slice(0, 3)
                .filter(p => p.upvotes > 0); // Only show if they have at least 1 upvote

            renderFeaturedUsers(top3);
        } catch (error) {
            console.error('Error loading featured users:', error);
            if (featuredUsers) {
                featuredUsers.innerHTML = '<div class="no-featured">No featured users yet. Start voting!</div>';
            }
        }
    }

    // Render featured users
    function renderFeaturedUsers(top3) {
        if (!featuredUsers) return;

        if (top3.length === 0) {
            featuredUsers.innerHTML = '<div class="no-featured">No featured users yet. Start voting!</div>';
            return;
        }

        const medals = ['🥇', '🥈', '🥉'];
        
        featuredUsers.innerHTML = top3.map((person, index) => `
            <div class="featured-user-card">
                <div class="featured-medal">${medals[index]}</div>
                <div class="featured-user-info">
                    <div class="featured-user-name">${escapeHtml(person.name)}</div>
                    <div class="featured-user-stats">
                        <span class="featured-upvotes">${person.upvotes} upvote${person.upvotes !== 1 ? 's' : ''}</span>
                        <span class="featured-score">Score: ${person.score > 0 ? '+' : ''}${person.score}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Get current voting period start (9:30 PM France time) in UTC
    // This determines when users can vote again (daily reset at 9:30 PM France time)
    function getCurrentVotingPeriodStartUTC() {
        const now = new Date();
        
        // Get current time components in France timezone
        const franceFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Europe/Paris',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        
        const parts = franceFormatter.formatToParts(now);
        const franceYear = parseInt(parts.find(p => p.type === 'year').value);
        const franceMonth = parseInt(parts.find(p => p.type === 'month').value) - 1;
        const franceDay = parseInt(parts.find(p => p.type === 'day').value);
        const franceHour = parseInt(parts.find(p => p.type === 'hour').value);
        const franceMinute = parseInt(parts.find(p => p.type === 'minute').value);
        
        // Determine if we're past 9:30 PM France time
        const isAfterReset = franceHour > 21 || (franceHour === 21 && franceMinute >= 30);
        
        // Calculate the reset date (9:30 PM France time)
        let resetDay = franceDay;
        if (!isAfterReset) {
            // Before 9:30 PM, reset was yesterday
            resetDay = franceDay - 1;
            // Handle month/year rollover
            if (resetDay < 1) {
                const prevMonth = new Date(franceYear, franceMonth, 0);
                resetDay = prevMonth.getDate();
                // Would need to handle year rollover too, but for simplicity...
            }
        }
        
        // Create a date representing 9:30 PM France time
        // We'll create it as if it were a local time, then convert
        const franceResetDate = new Date(franceYear, franceMonth, resetDay, 21, 30, 0, 0);
        
        // Now we need to convert this "France local time" to UTC
        // Get the timezone offset for France
        const tempDate = new Date();
        const franceString = tempDate.toLocaleString('en-US', { timeZone: 'Europe/Paris' });
        const utcString = tempDate.toLocaleString('en-US', { timeZone: 'UTC' });
        
        // Calculate offset: difference between UTC and France time
        const franceDate = new Date(franceString);
        const utcDate = new Date(utcString);
        const offsetMs = franceDate.getTime() - utcDate.getTime();
        
        // Apply offset to get UTC time
        const utcResetDate = new Date(franceResetDate.getTime() - offsetMs);
        
        return utcResetDate;
    }
    
    // Load user's votes to show which people they've voted on (only current voting period)
    async function loadUserVotes() {
        if (!currentUser) return;

        try {
            // Get the start of the current voting period (9:30 PM France time)
            const votingPeriodStart = getCurrentVotingPeriodStartUTC();
            
            const { data, error } = await supabase
                .from('votes')
                .select('person_id, vote_type, created_at')
                .eq('user_id', currentUser.id)
                .gte('created_at', votingPeriodStart.toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;

            userVotes = {};

            if (data) {
                // Group by person_id and get the most recent vote from current period
                const votesByPerson = {};
                data.forEach(vote => {
                    if (!votesByPerson[vote.person_id]) {
                        votesByPerson[vote.person_id] = vote;
                    }
                });

                // Store votes from current voting period
                Object.values(votesByPerson).forEach(vote => {
                    userVotes[vote.person_id] = vote.vote_type;
                });
            }

            // Re-render people to show vote status
            renderPeople();
        } catch (error) {
            console.error('Error loading user votes:', error);
        }
    }

    // Render people list
    function renderPeople() {
        // Prevent rendering if element doesn't exist
        if (!peopleList) {
            console.error('People list element not found');
            return;
        }
        
        if (filteredPeople.length === 0) {
            peopleList.innerHTML = '<div class="empty-state"><h3>No people found</h3><p>Try adjusting your filters</p></div>';
            return;
        }

        peopleList.innerHTML = filteredPeople.map(person => {
            const adminButtons = isAdmin ? `
                <div class="person-actions">
                    <button class="edit-btn" onclick="editPerson(${person.id}, '${escapeHtml(person.name)}', ${person.score})">✏️ Edit</button>
                    <button class="delete-btn" onclick="deletePerson(${person.id})">🗑️ Delete</button>
                </div>
            ` : '';
            
            // Vote buttons - only show if user is logged in
            const userVote = userVotes[person.id];
            const voteButtons = currentUser ? `
                <div class="vote-buttons">
                    <button class="vote-btn vote-up ${userVote === 'up' ? 'active' : ''}" 
                            onclick="voteOnPerson(${person.id}, 'up')" 
                            title="${userVote === 'up' ? 'Click to undo upvote' : userVote === 'down' ? 'Click to change to upvote' : 'Vote up'}">
                        ${userVote === 'up' ? '✓' : '↑'} Up
                    </button>
                    <button class="vote-btn vote-down ${userVote === 'down' ? 'active' : ''}" 
                            onclick="voteOnPerson(${person.id}, 'down')" 
                            title="${userVote === 'down' ? 'Click to undo downvote' : userVote === 'up' ? 'Click to change to downvote' : 'Vote down'}">
                        ${userVote === 'down' ? '✓' : '↓'} Down
                    </button>
                </div>
            ` : `
                <div class="vote-buttons">
                    <button class="vote-btn vote-up disabled" disabled title="Login to vote">↑ Up</button>
                    <button class="vote-btn vote-down disabled" disabled title="Login to vote">↓ Down</button>
                </div>
            `;
            
            return `
            <div class="person-card" data-person-id="${person.id}">
                <div class="person-name">${escapeHtml(person.name)}</div>
                <div class="person-score ${getScoreClass(person.score)}">
                    ${person.score > 0 ? '+' : ''}${person.score}
                </div>
                ${voteButtons}
                ${adminButtons}
            </div>
        `;
        }).join('');
    }

    // Get score CSS class
    function getScoreClass(score) {
        if (score > 0) return 'score-positive';
        if (score < 0) return 'score-negative';
        return 'score-neutral';
    }

    // Filter people
    function filterPeople() {
        filteredPeople = [...allPeople];

        // Filter by search
        if (currentFilter.search) {
            const searchLower = currentFilter.search.toLowerCase();
            filteredPeople = filteredPeople.filter(p => 
                p.name.toLowerCase().includes(searchLower)
            );
        }

        // Filter by letter
        if (currentFilter.letter) {
            filteredPeople = filteredPeople.filter(p => 
                p.name.charAt(0).toUpperCase() === currentFilter.letter
            );
        }

        // Filter by score range
        if (currentFilter.score) {
            switch (currentFilter.score) {
                case 'negative':
                    filteredPeople = filteredPeople.filter(p => p.score < 0);
                    break;
                case 'low':
                    filteredPeople = filteredPeople.filter(p => p.score >= 0 && p.score <= 100);
                    break;
                case 'medium':
                    filteredPeople = filteredPeople.filter(p => p.score > 100 && p.score <= 250);
                    break;
                case 'high':
                    filteredPeople = filteredPeople.filter(p => p.score > 250 && p.score <= 400);
                    break;
                case 'very-high':
                    filteredPeople = filteredPeople.filter(p => p.score > 400);
                    break;
            }
        }

        // Sort
        filteredPeople.sort((a, b) => {
            if (sortOrder === 'asc') {
                return a.name.localeCompare(b.name);
            } else {
                return b.name.localeCompare(a.name);
            }
        });

        renderPeople();
        updateStats();
    }

    // Update statistics
    function updateStats() {
        const people = filteredPeople.length > 0 ? filteredPeople : allPeople;
        
        totalCount.textContent = people.length;
        
        if (people.length > 0) {
            const avg = Math.round(people.reduce((sum, p) => sum + p.score, 0) / people.length);
            avgScore.textContent = avg > 0 ? `+${avg}` : avg;
            
            const highest = Math.max(...people.map(p => p.score));
            highestScore.textContent = highest > 0 ? `+${highest}` : highest;
        } else {
            avgScore.textContent = '0';
            highestScore.textContent = '0';
        }
    }

    // Toggle sort
    function toggleSort() {
        sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        sortBtn.textContent = `Sort: ${sortOrder === 'asc' ? 'A-Z' : 'Z-A'}`;
        filterPeople();
    }

    // User Authentication Functions
    async function checkUserAuth() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session && session.user) {
                currentUser = session.user;
                await loadUserUsername(); // Load username when checking auth
                updateUserAuthUI();
                // Start periodic refresh to check if 24-hour cooldown has expired
                startUserVotesRefresh();
            } else {
                currentUser = null;
                userVotes = {};
                userUsername = null;
                updateUserAuthUI();
                // Stop periodic refresh if user is logged out
                stopUserVotesRefresh();
            }
        } catch (error) {
            console.error('Error checking user auth:', error);
            currentUser = null;
            userUsername = null;
            stopUserVotesRefresh();
        }
    }

    function updateUserAuthUI() {
        if (userAuthBtn) {
            if (currentUser) {
                userAuthBtn.textContent = `👤 ${currentUser.email}`;
                userAuthBtn.title = 'Click to logout';
            } else {
                userAuthBtn.textContent = '👤 Login';
                userAuthBtn.title = 'Click to login or sign up';
            }
        }
    }

    async function userSignup(email, password, confirmPassword) {
        if (password !== confirmPassword) {
            showUserAuthError('Passwords do not match');
            return false;
        }

        if (password.length < 6) {
            showUserAuthError('Password must be at least 6 characters');
            return false;
        }

        const username = document.getElementById('signupUsername')?.value.trim();
        if (!username) {
            showUserAuthError('Username is required');
            return false;
        }

        if (username.length < 3 || username.length > 20) {
            showUserAuthError('Username must be between 3 and 20 characters');
            return false;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            showUserAuthError('Username can only contain letters, numbers, and underscores');
            return false;
        }

        // Block reserved usernames (case-insensitive)
        const reservedUsernames = ['admin', 'administrator', 'mod', 'moderator', 'system'];
        if (reservedUsernames.includes(username.toLowerCase())) {
            showUserAuthError('This username is reserved. Please choose another.');
            return false;
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password
            });

            if (error) {
                showUserAuthError(error.message);
                return false;
            }

            if (data.user) {
                currentUser = data.user;
                
                // If email confirmation is enabled, session might not be available immediately
                // In that case, we'll create the profile after email confirmation
                if (data.session) {
                    // Session is available immediately (email confirmation disabled)
                    // Set the session to ensure RLS policies work
                    await supabase.auth.setSession({
                        access_token: data.session.access_token,
                        refresh_token: data.session.refresh_token
                    });
                    
                    // Small delay to ensure session is propagated
                    await new Promise(resolve => setTimeout(resolve, 200));
                    
                    // Create user profile with username
                    const { error: profileError } = await supabase
                        .from('user_profiles')
                        .insert([{
                            user_id: currentUser.id,
                            username: username
                        }]);

                    if (profileError) {
                        // Check if username is taken (unique constraint violation)
                        if (profileError.code === '23505' || profileError.message?.includes('unique')) {
                            // Username is taken - sign out the user since we can't complete signup
                            await supabase.auth.signOut();
                            showUserAuthError('Username is already taken. Please choose another.');
                            return false;
                        }
                        // Check if table doesn't exist
                        if (profileError.code === '42P01' || profileError.message?.includes('does not exist')) {
                            // Sign out the user since profile creation failed
                            await supabase.auth.signOut();
                            showUserAuthError('Database table not found. Please contact admin.');
                            console.error('Error: user_profiles table does not exist. Run CREATE_USER_PROFILES_TABLE.sql');
                            return false;
                        }
                        // Check if RLS policy is blocking
                        if (profileError.code === '42501' || profileError.message?.includes('permission') || profileError.message?.includes('policy')) {
                            // Profile creation failed but user account exists
                            // Don't sign out - let them try to set username on next login
                            console.error('Error: RLS policy blocking insert:', profileError);
                            showUserAuthError('Account created! Please log in to set your username.');
                            closeModal(userAuthModal);
                            userSignupForm.reset();
                            hideUserAuthError();
                            // Sign out so they can log in fresh
                            await supabase.auth.signOut();
                            return false;
                        }
                        // Other errors - sign out and show error
                        console.error('Error creating profile:', profileError);
                        await supabase.auth.signOut();
                        showUserAuthError(`Error setting up profile: ${profileError.message || 'Please try again.'}`);
                        return false;
                    }

                    userUsername = username;
                    updateUserAuthUI();
                    closeModal(userAuthModal);
                    userSignupForm.reset();
                    hideUserAuthError();
                    await loadUserVotes();
                    await loadPeople(); // Reload to show vote buttons
                    updateChatUI(); // Enable chat
                    return true;
                } else {
                    // Email confirmation is enabled - user needs to confirm email first
                    // Profile will be created when they log in after confirmation
                    showUserAuthError('Please check your email to confirm your account. After confirmation, you can log in and set your username.');
                    closeModal(userAuthModal);
                    userSignupForm.reset();
                    return false;
                }
            }
        } catch (error) {
            console.error('Signup error:', error);
            showUserAuthError('Signup failed. Please try again.');
            return false;
        }
    }

    async function userLogin(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                showUserAuthError(error.message);
                return false;
            }

            if (data.user) {
                currentUser = data.user;
                await loadUserUsername(); // Load username from profile
                
                // If user doesn't have a profile yet (signup might have failed), prompt for username
                if (!userUsername) {
                    // User exists but no profile - they need to set username
                    updateUserAuthUI();
                    closeModal(userAuthModal);
                    userLoginForm.reset();
                    hideUserAuthError();
                    // Open username modal to set username
                    openModal(usernameModal);
                    return true;
                }
                
                updateUserAuthUI();
                closeModal(userAuthModal);
                userLoginForm.reset();
                hideUserAuthError();
                await loadUserVotes();
                await loadPeople(); // Reload to show vote buttons
                updateChatUI(); // Enable chat
                
                // Start periodic refresh of user votes to check daily reset (9:30 PM France time)
                startUserVotesRefresh();
                
                return true;
            }
        } catch (error) {
            console.error('Login error:', error);
            showUserAuthError('Login failed. Please try again.');
            return false;
        }
    }

    async function userLogout() {
        try {
            await supabase.auth.signOut();
            currentUser = null;
            userVotes = {};
            userUsername = null;
            updateUserAuthUI();
            await loadPeople(); // Reload to hide vote buttons
            updateChatUI(); // Update chat UI to disable input
            
            // Stop periodic refresh of user votes
            stopUserVotesRefresh();
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
    
    // Start periodic refresh of user votes to check if daily reset (9:30 PM France time) has occurred
    function startUserVotesRefresh() {
        // Stop existing interval if any
        if (userVotesRefreshInterval) {
            clearInterval(userVotesRefreshInterval);
        }
        
        // Refresh user votes every minute to check if 9:30 PM France time has passed
        // This ensures the UI updates when the daily reset occurs and users can vote again
        userVotesRefreshInterval = setInterval(async () => {
            if (currentUser) {
                await loadUserVotes();
            } else {
                stopUserVotesRefresh();
            }
        }, 60 * 1000); // Every minute (to catch the 9:30 PM reset time)
    }
    
    // Stop periodic refresh of user votes
    function stopUserVotesRefresh() {
        if (userVotesRefreshInterval) {
            clearInterval(userVotesRefreshInterval);
            userVotesRefreshInterval = null;
        }
    }

    function showUserAuthError(message) {
        const errorDiv = document.getElementById('userAuthError');
        const signupErrorDiv = document.getElementById('userSignupError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
        if (signupErrorDiv) {
            signupErrorDiv.textContent = message;
            signupErrorDiv.style.display = 'block';
        }
    }

    function hideUserAuthError() {
        const errorDiv = document.getElementById('userAuthError');
        const signupErrorDiv = document.getElementById('userSignupError');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
        if (signupErrorDiv) {
            signupErrorDiv.style.display = 'none';
        }
    }

    // Update a single person's score in real-time
    async function updatePersonScore(personId) {
        try {
            const newScore = await calculateScoreFromVotes(personId);
            
            // Update in allPeople array
            const personIndex = allPeople.findIndex(p => p.id === personId);
            if (personIndex !== -1) {
                allPeople[personIndex].score = newScore;
            }
            
            // Update in filteredPeople array
            const filteredIndex = filteredPeople.findIndex(p => p.id === personId);
            if (filteredIndex !== -1) {
                filteredPeople[filteredIndex].score = newScore;
            }
            
            // Update the UI for this specific person card
            updatePersonCardUI(personId, newScore);
            
            // Update stats
            updateStats();
            
            // Update featured users (only if this person might be in top 3)
            await updateFeaturedUsersIfNeeded();
            
            // Update trending users
            await loadTrendingUsers();
        } catch (error) {
            console.error('Error updating person score:', error);
        }
    }

    // Update a specific person card in the UI
    function updatePersonCardUI(personId, newScore) {
        const personCard = document.querySelector(`[data-person-id="${personId}"]`);
        if (!personCard) return;
        
        // Update score display
        const scoreElement = personCard.querySelector('.person-score');
        if (scoreElement) {
            scoreElement.textContent = `${newScore > 0 ? '+' : ''}${newScore}`;
            scoreElement.className = `person-score ${getScoreClass(newScore)}`;
        }
    }

    // Update featured users only if needed (optimized)
    async function updateFeaturedUsersIfNeeded() {
        if (!featuredUsers) return;
        
        try {
            // Simply reload featured users - it's fast and ensures accuracy
            await loadFeaturedUsers();
        } catch (error) {
            console.error('Error updating featured users:', error);
        }
    }

    // Vote Functions
    async function voteOnPerson(personId, voteType) {
        if (!currentUser) {
            openModal(userAuthModal);
            return;
        }

        try {
            // Check if user has an existing vote for this person (get most recent)
            const { data: existingVotesData, error: fetchError } = await supabase
                .from('votes')
                .select('id, vote_type, created_at')
                .eq('user_id', currentUser.id)
                .eq('person_id', personId)
                .order('created_at', { ascending: false })
                .limit(1);
            
            const existingVote = existingVotesData && existingVotesData.length > 0 ? existingVotesData[0] : null;

            if (fetchError && fetchError.code !== 'PGRST116') {
                // PGRST116 means no rows found, which is fine
                throw fetchError;
            }

            // Get the start of the current voting period (9:30 PM France time)
            const votingPeriodStart = getCurrentVotingPeriodStartUTC();
            
            let canVoteAgain = true;
            let isInCurrentPeriod = false;
            
            if (existingVote) {
                const voteDate = new Date(existingVote.created_at);
                // Check if vote is from current voting period (since last 9:30 PM France time)
                isInCurrentPeriod = voteDate >= votingPeriodStart;
                canVoteAgain = !isInCurrentPeriod;
            }

            // If user already voted the same way in current period, undo the vote (remove it)
            if (existingVote && isInCurrentPeriod && existingVote.vote_type === voteType) {
                // Remove the vote
                const { error } = await supabase
                    .from('votes')
                    .delete()
                    .eq('id', existingVote.id);

                if (error) throw error;

                // Update local state
                delete userVotes[personId];
            } 
            // If user voted differently in current period, update the vote
            else if (existingVote && isInCurrentPeriod && existingVote.vote_type !== voteType) {
                // Update existing vote
                const { error } = await supabase
                    .from('votes')
                    .update({ vote_type: voteType })
                    .eq('id', existingVote.id);

                if (error) throw error;

                // Update local state
                userVotes[personId] = voteType;
            }
            // If no existing vote OR vote is from previous period, insert new vote
            else {
                // If there's an old vote from previous period, we don't delete it
                // We just create a new vote (keeping historical data)
                // The app logic will only count votes from current period
                
                // Insert new vote for current voting period
                const { data, error } = await supabase
                    .from('votes')
                    .insert([{
                        user_id: currentUser.id,
                        person_id: personId,
                        vote_type: voteType
                    }])
                    .select()
                    .single();

                if (error) {
                    if (error.code === '23505') { // Unique constraint violation (if constraint still exists)
                        // If constraint exists, update the existing vote
                        // But first check if it's from current period
                        if (existingVote) {
                            const voteDate = new Date(existingVote.created_at);
                            if (voteDate >= votingPeriodStart) {
                                // Vote is from current period, update it
                                const { error: updateError } = await supabase
                                    .from('votes')
                                    .update({ vote_type: voteType })
                                    .eq('id', existingVote.id);
                                
                                if (updateError) throw updateError;
                            } else {
                                // Vote is from previous period, we can't update due to constraint
                                // This means the UNIQUE constraint still exists - user needs to run migration
                                throw new Error('Cannot vote: Please run UPDATE_VOTES_TABLE_24HOUR.sql to enable daily voting resets');
                            }
                        }
                    } else {
                        throw error;
                    }
                }

                // Update local state
                userVotes[personId] = voteType;
            }

            // Update only this person's score in real-time (no full reload!)
            await updatePersonScore(personId);
            
            // Update the vote buttons UI for this person
            updatePersonVoteButtons(personId);
            
            // Reload user votes to refresh the state
            await loadUserVotes();
        } catch (error) {
            console.error('Error voting:', error);
            alert('Error submitting vote. Please try again.');
        }
    }

    // Update vote buttons UI for a specific person
    function updatePersonVoteButtons(personId) {
        const personCard = document.querySelector(`[data-person-id="${personId}"]`);
        if (!personCard || !currentUser) return;
        
        const userVote = userVotes[personId];
        const voteButtonsContainer = personCard.querySelector('.vote-buttons');
        
        if (!voteButtonsContainer) return;
        
        // Update the buttons
        const upButton = voteButtonsContainer.querySelector('.vote-up');
        const downButton = voteButtonsContainer.querySelector('.vote-down');
        
        if (upButton) {
            upButton.className = `vote-btn vote-up ${userVote === 'up' ? 'active' : ''}`;
            upButton.title = userVote === 'up' ? 'Click to undo upvote' : userVote === 'down' ? 'Click to change to upvote' : 'Vote up';
            upButton.innerHTML = `${userVote === 'up' ? '✓' : '↑'} Up`;
        }
        
        if (downButton) {
            downButton.className = `vote-btn vote-down ${userVote === 'down' ? 'active' : ''}`;
            downButton.title = userVote === 'down' ? 'Click to undo downvote' : userVote === 'up' ? 'Click to change to downvote' : 'Vote down';
            downButton.innerHTML = `${userVote === 'down' ? '✓' : '↓'} Down`;
        }
    }

    // Admin Functions
    async function checkAdminStatus() {
        try {
            // Check if user is authenticated with Supabase
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session) {
                const userId = session.user?.id;
                // Check if this is the admin user
                if (ADMIN_USER_ID && userId === ADMIN_USER_ID) {
                    isAdmin = true;
                    sessionStorage.setItem('isAdmin', 'true');
                    updateAdminUI();
                } else if (!ADMIN_USER_ID) {
                    // If ADMIN_USER_ID not set, allow any authenticated user (testing only)
                    isAdmin = true;
                    sessionStorage.setItem('isAdmin', 'true');
                    updateAdminUI();
                }
            } else {
                // No active session, clear admin status
                isAdmin = false;
                sessionStorage.removeItem('isAdmin');
                sessionStorage.removeItem('adminSession');
            }
        } catch (error) {
            console.error('Error checking admin status:', error);
            isAdmin = false;
        }
    }

    function updateAdminUI() {
        if (isAdmin) {
            adminBtn.textContent = '🔓 Logout';
            adminControls.style.display = 'flex';
        } else {
            adminBtn.textContent = '🔐 Admin';
            adminControls.style.display = 'none';
        }
        renderPeople(); // Re-render to show/hide edit buttons
        renderNewsList(); // Re-render to show/hide delete buttons
    }

    // Login with Supabase Auth
    async function login(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                showLoginError(error.message);
                return false;
            }

            // Check if this user is the admin
            const userId = data.user?.id;
            if (ADMIN_USER_ID && userId === ADMIN_USER_ID) {
                isAdmin = true;
                sessionStorage.setItem('isAdmin', 'true');
                sessionStorage.setItem('adminSession', data.session?.access_token);
                updateAdminUI();
                closeModal(loginModal);
                loginForm.reset();
                hideLoginError();
                return true;
            } else if (!ADMIN_USER_ID) {
                // If ADMIN_USER_ID is not set, allow any authenticated user (for testing)
                // ⚠️ WARNING: Set ADMIN_USER_ID for production!
                isAdmin = true;
                sessionStorage.setItem('isAdmin', 'true');
                sessionStorage.setItem('adminSession', data.session?.access_token);
                updateAdminUI();
                closeModal(loginModal);
                loginForm.reset();
                hideLoginError();
                return true;
            } else {
                // User is authenticated but not the admin
                await supabase.auth.signOut();
                showLoginError('Access denied. This account is not authorized.');
                return false;
            }
        } catch (error) {
            console.error('Login error:', error);
            showLoginError('Login failed. Please try again.');
            return false;
        }
    }

    function showLoginError(message) {
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }

    function hideLoginError() {
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    async function logout() {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Logout error:', error);
        }
        isAdmin = false;
        sessionStorage.removeItem('isAdmin');
        sessionStorage.removeItem('adminSession');
        updateAdminUI();
    }

    // Add person
    async function addPerson(name, score) {
        try {
            const { data, error } = await supabase
                .from('people')
                .insert([{
                    name: name.trim(),
                    score: parseInt(score),
                    approved: true
                }])
                .select();

            if (error) throw error;

            // Clear filters to show all people after add
            currentFilter = { letter: '', score: '', search: '' };
            searchInput.value = '';
            letterFilter.value = '';
            scoreFilter.value = '';
            
            await loadPeople();
            closeModal(editModal);
            personForm.reset();
            editingPersonId = null;
        } catch (error) {
            console.error('Error adding person:', error);
            alert('Error adding person. Please try again.');
        }
    }

    // Edit person
    async function updatePerson(id, name, score) {
        try {
            const { error } = await supabase
                .from('people')
                .update({
                    name: name.trim(),
                    score: parseInt(score)
                })
                .eq('id', id);

            if (error) throw error;

            // Clear filters to show all people after edit
            currentFilter = { letter: '', score: '', search: '' };
            searchInput.value = '';
            letterFilter.value = '';
            scoreFilter.value = '';
            
            await loadPeople();
            closeModal(editModal);
            personForm.reset();
            editingPersonId = null;
        } catch (error) {
            console.error('Error updating person:', error);
            alert('Error updating person. Please try again.');
        }
    }

    // Delete person
    async function deletePerson(id) {
        if (!confirm('Are you sure you want to delete this person?')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('people')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Clear filters to show all people after delete
            currentFilter = { letter: '', score: '', search: '' };
            searchInput.value = '';
            letterFilter.value = '';
            scoreFilter.value = '';
            
            await loadPeople();
        } catch (error) {
            console.error('Error deleting person:', error);
            alert('Error deleting person. Please try again.');
        }
    }

    // Open edit modal
    function editPerson(id, name, score) {
        editingPersonId = id;
        document.getElementById('modalTitle').textContent = 'Edit Person';
        document.getElementById('personName').value = name;
        document.getElementById('personScore').value = score;
        openModal(editModal);
    }

    // News Functions
    async function loadNews(checkForNew = false) {
        try {
            const { data, error } = await supabase
                .from('news')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data && data.length > 0) {
                // Check for new news if this is a periodic check
                if (checkForNew && lastNewsCheck && allNews.length > 0) {
                    const newNews = data.filter(news => {
                        const newsDate = new Date(news.created_at);
                        const lastCheckDate = new Date(lastNewsCheck);
                        return newsDate > lastCheckDate;
                    });

                    if (newNews.length > 0) {
                        // Show notification for new news
                        showNewsNotification(newNews);
                    }
                }

                allNews = data;
                // Update last check time (set to most recent news timestamp)
                if (data.length > 0) {
                    if (!lastNewsCheck) {
                        // First time loading - set to most recent news
                        lastNewsCheck = data[0].created_at;
                    } else {
                        // Only update if we have newer news
                        const mostRecent = new Date(data[0].created_at);
                        const lastCheck = new Date(lastNewsCheck);
                        if (mostRecent > lastCheck) {
                            lastNewsCheck = data[0].created_at;
                        }
                    }
                }
            } else {
                allNews = [];
            }

            renderNewsTicker();
            renderNewsList();
        } catch (error) {
            console.error('Error loading news:', error);
            // If table doesn't exist, hide the ticker
            if (newsTickerContainer) {
                newsTickerContainer.style.display = 'none';
            }
        }
    }

    // Request notification permission and show news notification
    async function requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    }

    // Show notification for new news
    function showNewsNotification(newNewsItems) {
        if (!('Notification' in window)) return;

        // Request permission if not already granted
        if (Notification.permission === 'default') {
            requestNotificationPermission().then(hasPermission => {
                if (hasPermission && newNewsItems.length > 0) {
                    showNotification(newNewsItems);
                }
            });
        } else if (Notification.permission === 'granted') {
            showNotification(newNewsItems);
        }
    }

    function showNotification(newNewsItems) {
        const latestNews = newNewsItems[0];
        const title = newNewsItems.length === 1 
            ? '🔴 New Breaking News!' 
            : `🔴 ${newNewsItems.length} New News Items!`;
        
        const body = latestNews.text.length > 100 
            ? latestNews.text.substring(0, 100) + '...' 
            : latestNews.text;

        new Notification(title, {
            body: body,
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23FF9000"/></svg>',
            badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23FF9000"/></svg>',
            tag: 'auralist-news',
            requireInteraction: false
        });
    }

    // Start periodic news checking
    function startNewsNotifications() {
        // Request permission on page load
        requestNotificationPermission();

        // Check for new news every 30 seconds
        if (newsCheckInterval) {
            clearInterval(newsCheckInterval);
        }

        newsCheckInterval = setInterval(async () => {
            await loadNews(true); // Check for new news
        }, 30000); // Check every 30 seconds
    }

    // Stop news notifications
    function stopNewsNotifications() {
        if (newsCheckInterval) {
            clearInterval(newsCheckInterval);
            newsCheckInterval = null;
        }
    }

    function renderNewsTicker() {
        if (!newsTicker) return;

        if (allNews.length === 0) {
            if (newsTickerContainer) {
                newsTickerContainer.style.display = 'none';
            }
            return;
        }

        if (newsTickerContainer) {
            newsTickerContainer.style.display = 'block';
        }
        
        // Create news items with separators
        const newsItems = allNews.map(news => 
            `<span class="news-item">${escapeHtml(news.text)}</span>`
        ).join('<span class="news-separator"> • </span>');
        
        if (!newsItems || newsItems.trim() === '') {
            if (newsTickerContainer) {
                newsTickerContainer.style.display = 'none';
            }
            return;
        }
        
        // For seamless infinite scroll, we need multiple copies
        // The animation starts from viewport width and moves to negative content width
        const separator = '<span class="news-separator"> • </span>';
        // Create enough copies to ensure smooth looping (at least 3-4 copies)
        const duplicatedContent = newsItems + separator + newsItems + separator + newsItems + separator + newsItems;
        
        // Set content
        newsTicker.textContent = ''; // Clear first
        newsTicker.innerHTML = duplicatedContent;
        
        // Calculate animation duration based on content length (optional - for consistent speed)
        // For now, use fixed duration
        newsTicker.style.animation = 'scroll-ticker 30s linear infinite';
        
        // Force animation restart
        newsTicker.style.animationPlayState = 'running';
    }

    function renderNewsList() {
        if (!newsList) return;

        if (allNews.length === 0) {
            newsList.innerHTML = '<p class="no-news">No news items. Add one above!</p>';
            return;
        }

        newsList.innerHTML = allNews.map(news => `
            <div class="news-list-item">
                <div class="news-list-text">${escapeHtml(news.text)}</div>
                ${isAdmin ? `<button class="delete-news-btn" onclick="deleteNews(${news.id})">🗑️ Delete</button>` : ''}
            </div>
        `).join('');
    }

    async function addNews(text) {
        try {
            const { error } = await supabase
                .from('news')
                .insert([{
                    text: text.trim()
                }]);

            if (error) throw error;

            await loadNews();
            newsForm.reset();
            
            // Trigger notification for the new news (if other users are viewing)
            // The periodic check will catch it for other users
        } catch (error) {
            console.error('Error adding news:', error);
            alert('Error adding news. Make sure the news table exists in Supabase!');
        }
    }

    async function deleteNews(id) {
        if (!confirm('Are you sure you want to delete this news item?')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('news')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await loadNews();
        } catch (error) {
            console.error('Error deleting news:', error);
            alert('Error deleting news. Please try again.');
        }
    }

    // Chat Functions
    async function loadChatMessages(forceRender = false) {
        if (!chatMessages) return;

        try {
            // Only load messages from last 4 hours
            const fourHoursAgo = new Date();
            fourHoursAgo.setHours(fourHoursAgo.getHours() - 4);

            const { data, error } = await supabase
                .from('chat_messages')
                .select('*, user_id')
                .gte('created_at', fourHoursAgo.toISOString())
                .order('created_at', { ascending: true });

            if (error) throw error;

            const messages = data || [];
            
            // Only re-render if there are actual changes (new messages or count changed)
            const currentMessageCount = messages.length;
            const currentMessageIds = new Set(messages.map(m => m.id));
            
            // Check if there are new messages
            const hasNewMessages = messages.some(msg => !lastChatMessageIds.has(msg.id));
            const countChanged = currentMessageCount !== lastChatMessageCount;
            
            if (forceRender || hasNewMessages || countChanged) {
                renderChatMessages(messages);
                lastChatMessageCount = currentMessageCount;
                lastChatMessageIds = currentMessageIds;
            }
            
            updateChatUI();
        } catch (error) {
            console.error('Error loading chat messages:', error);
            if (chatMessages) {
                chatMessages.innerHTML = '<div class="chat-error">Unable to load chat. Please refresh.</div>';
            }
        }
    }

    function renderChatMessages(messages) {
        if (!chatMessages) return;

        if (messages.length === 0) {
            chatMessages.innerHTML = '<div class="chat-empty">No messages yet. Be the first to chat!</div>';
            return;
        }

        // Store current scroll position
        const wasAtBottom = chatMessages.scrollHeight - chatMessages.scrollTop <= chatMessages.clientHeight + 100;

        chatMessages.innerHTML = messages.map(msg => {
            const isCurrentUser = currentUser && msg.user_id === currentUser.id;
            const time = new Date(msg.created_at).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            });
            
            return `
                <div class="chat-message ${isCurrentUser ? 'chat-message-own' : ''}">
                    <div class="chat-message-header">
                        <span class="chat-username">${escapeHtml(msg.username)}</span>
                        <span class="chat-time">${time}</span>
                    </div>
                    <div class="chat-message-text">${escapeHtml(msg.message)}</div>
                </div>
            `;
        }).join('');

        // Auto-scroll to bottom only if user was already at bottom
        if (wasAtBottom) {
            setTimeout(() => {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 100);
        }
    }

    function updateChatUI() {
        if (!chatInput || !chatSendBtn) return;

        if (currentUser) {
            // Check if user has a username
            if (!userUsername) {
                // User needs to set username first - make it look disabled but still clickable
                chatInput.readOnly = true;
                chatInput.disabled = false; // Don't disable, use readOnly instead
                chatSendBtn.disabled = true;
                chatInput.placeholder = 'Click to set username first';
                chatInput.style.cursor = 'pointer';
                chatInput.style.backgroundColor = 'rgba(26, 26, 26, 0.5)'; // Visual feedback
                chatInput.setAttribute('data-needs-username', 'true');
            } else {
                // User has username - enable chat
                chatInput.readOnly = false;
                chatInput.disabled = false;
                chatSendBtn.disabled = false;
                chatInput.placeholder = 'Type your message...';
                chatInput.style.cursor = 'text';
                chatInput.style.backgroundColor = ''; // Reset background
                chatInput.removeAttribute('data-needs-username');
                chatInput.setAttribute('data-username', userUsername);
            }
        } else {
            // User is not logged in - disable chat
            chatInput.readOnly = true;
            chatInput.disabled = true;
            chatSendBtn.disabled = true;
            chatInput.placeholder = 'Type your message... (Login to chat)';
            chatInput.style.cursor = 'not-allowed';
            chatInput.style.backgroundColor = '';
            chatInput.removeAttribute('data-needs-username');
        }
    }

    // Load user's username from profile
    async function loadUserUsername() {
        if (!currentUser) {
            userUsername = null;
            return;
        }

        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('username')
                .eq('user_id', currentUser.id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No profile found - user needs to set username
                    userUsername = null;
                } else {
                    console.error('Error loading username:', error);
                    userUsername = null;
                }
            } else {
                userUsername = data?.username || null;
            }
        } catch (error) {
            console.error('Error loading username:', error);
            userUsername = null;
        }
    }

    // Set or update username
    async function setUsername(username) {
        if (!currentUser) return false;

        username = username.trim();
        if (!username || username.length < 3 || username.length > 20) {
            showUsernameError('Username must be between 3 and 20 characters');
            return false;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            showUsernameError('Username can only contain letters, numbers, and underscores');
            return false;
        }

        // Block reserved usernames (case-insensitive)
        const reservedUsernames = ['admin', 'administrator', 'mod', 'moderator', 'system'];
        if (reservedUsernames.includes(username.toLowerCase())) {
            showUsernameError('This username is reserved. Please choose another.');
            return false;
        }

        try {
            // Check if username already exists (case-insensitive check for other users)
            // Get all usernames and check case-insensitively
            const { data: allProfiles, error: checkError } = await supabase
                .from('user_profiles')
                .select('user_id, username');

            if (checkError) throw checkError;

            // Check if username exists (case-insensitive) for other users
            const usernameExists = allProfiles?.some(profile => 
                profile.username.toLowerCase() === username.toLowerCase() && 
                profile.user_id !== currentUser.id
            );

            if (usernameExists) {
                showUsernameError('Username is already taken. Please choose another.');
                return false;
            }

            // Insert or update username
            const { error } = await supabase
                .from('user_profiles')
                .upsert({
                    user_id: currentUser.id,
                    username: username
                }, {
                    onConflict: 'user_id'
                });

            if (error) {
                if (error.code === '23505') {
                    showUsernameError('Username is already taken. Please choose another.');
                } else {
                    throw error;
                }
                return false;
            }

            userUsername = username;
            updateChatUI();
            closeModal(usernameModal);
            usernameForm.reset();
            hideUsernameError();
            return true;
        } catch (error) {
            console.error('Error setting username:', error);
            showUsernameError('Error setting username. Please try again.');
            return false;
        }
    }

    function showUsernameError(message) {
        const errorDiv = document.getElementById('usernameError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }

    function hideUsernameError() {
        const errorDiv = document.getElementById('usernameError');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    async function sendChatMessage() {
        if (!currentUser || !chatInput) return;

        // Check if user has username
        if (!userUsername) {
            openModal(usernameModal);
            return;
        }

        const message = chatInput.value.trim();
        if (!message) return;

        const username = userUsername;

        try {
            const { data, error } = await supabase
                .from('chat_messages')
                .insert([{
                    user_id: currentUser.id,
                    username: username,
                    message: message
                }])
                .select()
                .single();

            if (error) throw error;

            // Clear input
            chatInput.value = '';
            
            // Force reload to show the new message
            if (data) {
                await loadChatMessages(true);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Error sending message. Please try again.');
        }
    }

    // Set up real-time chat subscription
    function setupChatRealtime() {
        // Remove existing subscription if any
        if (chatSubscription) {
            chatSubscription.unsubscribe();
        }

        // Subscribe to new messages
        chatSubscription = supabase
            .channel('chat_messages_channel', {
                config: {
                    broadcast: { self: true }
                }
            })
            .on('postgres_changes', 
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'chat_messages',
                    filter: '*'
                }, 
                async (payload) => {
                    console.log('New message received:', payload);
                    // Force reload to show the new message
                    await loadChatMessages(true);
                }
            )
            .on('postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: '*'
                },
                async (payload) => {
                    console.log('Message deleted:', payload);
                    await loadChatMessages(true);
                }
            )
            .subscribe((status) => {
                console.log('Chat subscription status:', status);
                if (status === 'SUBSCRIBED') {
                    console.log('Successfully subscribed to chat messages');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('Channel error, falling back to polling');
                    startChatPolling();
                } else if (status === 'TIMED_OUT') {
                    console.warn('Subscription timed out, falling back to polling');
                    startChatPolling();
                }
            });
    }

    // Fallback polling if real-time doesn't work
    let chatPollingInterval = null;

    function startChatPolling() {
        // Stop existing polling
        if (chatPollingInterval) {
            clearInterval(chatPollingInterval);
        }

        // Poll every 5 seconds for new messages (reduced frequency to reduce flickering)
        // Only check for new messages, don't force re-render
        chatPollingInterval = setInterval(async () => {
            await loadChatMessages(false); // Don't force render, only update if there are changes
        }, 5000); // Increased from 2 to 5 seconds
    }

    function stopChatPolling() {
        if (chatPollingInterval) {
            clearInterval(chatPollingInterval);
            chatPollingInterval = null;
        }
    }

    // Clean up old messages every hour
    function startChatCleanup() {
        // Clean up immediately
        cleanupOldChatMessages();

        // Then clean up every hour
        if (chatCleanupInterval) {
            clearInterval(chatCleanupInterval);
        }

        chatCleanupInterval = setInterval(() => {
            cleanupOldChatMessages();
        }, 3600000); // Every hour
    }

    async function cleanupOldChatMessages() {
        try {
            const fourHoursAgo = new Date();
            fourHoursAgo.setHours(fourHoursAgo.getHours() - 4);

            const { error } = await supabase
                .from('chat_messages')
                .delete()
                .lt('created_at', fourHoursAgo.toISOString());

            if (error) {
                console.error('Error cleaning up old messages:', error);
            }
        } catch (error) {
            console.error('Error in cleanup:', error);
        }
    }

    // Modal functions - Optimized for mobile
    function openModal(modal) {
        if (!modal) return;
        modal.classList.add('show');
        // Prevent body scroll on mobile when modal is open
        document.body.style.overflow = 'hidden';
        // Scroll to top of modal on mobile
        if (window.innerWidth <= 768) {
            modal.scrollTop = 0;
        }
    }

    function closeModal(modal) {
        if (!modal) return;
        modal.classList.remove('show');
        // Restore body scroll
        document.body.style.overflow = '';
    }

    // Setup event listeners
    function setupEventListeners() {
        // User auth button
        if (userAuthBtn) {
            userAuthBtn.addEventListener('click', () => {
                if (currentUser) {
                    userLogout();
                } else {
                    openModal(userAuthModal);
                }
            });
        }

        // User login/signup tab switching
        const loginTabBtn = document.getElementById('loginTabBtn');
        const signupTabBtn = document.getElementById('signupTabBtn');
        
        if (loginTabBtn) {
            loginTabBtn.addEventListener('click', () => {
                loginTabBtn.classList.add('active');
                signupTabBtn.classList.remove('active');
                userLoginForm.style.display = 'block';
                userSignupForm.style.display = 'none';
                hideUserAuthError();
            });
        }
        
        if (signupTabBtn) {
            signupTabBtn.addEventListener('click', () => {
                signupTabBtn.classList.add('active');
                loginTabBtn.classList.remove('active');
                userSignupForm.style.display = 'block';
                userLoginForm.style.display = 'none';
                hideUserAuthError();
            });
        }

        // User login form
        if (userLoginForm) {
            userLoginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('userEmail').value;
                const password = document.getElementById('userPassword').value;
                await userLogin(email, password);
            });
        }

        // User signup form
        if (userSignupForm) {
            userSignupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('signupEmail').value;
                const password = document.getElementById('signupPassword').value;
                const confirmPassword = document.getElementById('signupPasswordConfirm').value;
                await userSignup(email, password, confirmPassword);
            });
        }

        // Cancel user auth buttons
        const cancelUserAuthBtn = document.getElementById('cancelUserAuthBtn');
        const cancelSignupBtn = document.getElementById('cancelSignupBtn');
        if (cancelUserAuthBtn) {
            cancelUserAuthBtn.addEventListener('click', () => {
                closeModal(userAuthModal);
            });
        }
        if (cancelSignupBtn) {
            cancelSignupBtn.addEventListener('click', () => {
                closeModal(userAuthModal);
            });
        }

        // Admin button
        adminBtn.addEventListener('click', () => {
            if (isAdmin) {
                logout();
            } else {
                openModal(loginModal);
            }
        });

        // Admin login form
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('adminEmail').value;
            const password = document.getElementById('adminPassword').value;
            await login(email, password);
        });

        // Chat send button
        if (chatSendBtn) {
            chatSendBtn.addEventListener('click', (e) => {
                // If no username, open modal instead of sending
                if (currentUser && !userUsername) {
                    e.preventDefault();
                    openModal(usernameModal);
                } else {
                    sendChatMessage();
                }
            });
        }

        // Chat input - Enter key to send
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendChatMessage();
                }
            });

            // Chat input click - open username modal if needed
            chatInput.addEventListener('click', (e) => {
                const needsUsername = chatInput.getAttribute('data-needs-username') === 'true';
                if (needsUsername && currentUser && !userUsername) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Opening username modal...');
                    if (usernameModal) {
                        openModal(usernameModal);
                    } else {
                        console.error('Username modal element not found');
                    }
                }
            });

            // Also handle mousedown for better compatibility
            chatInput.addEventListener('mousedown', (e) => {
                const needsUsername = chatInput.getAttribute('data-needs-username') === 'true';
                if (needsUsername && currentUser && !userUsername) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (usernameModal) {
                        openModal(usernameModal);
                    }
                }
            });
        }

        // Username form
        if (usernameForm) {
            usernameForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = document.getElementById('usernameInput').value.trim();
                await setUsername(username);
            });
        }

        // Cancel username button
        const cancelUsernameBtn = document.getElementById('cancelUsernameBtn');
        if (cancelUsernameBtn) {
            cancelUsernameBtn.addEventListener('click', () => {
                closeModal(usernameModal);
                usernameForm.reset();
                hideUsernameError();
            });
        }

        // Close username modal with X button
        if (usernameModal) {
            usernameModal.querySelector('.close')?.addEventListener('click', () => {
                closeModal(usernameModal);
                usernameForm.reset();
                hideUsernameError();
            });
        }

        // Add person button
        document.getElementById('addPersonBtn').addEventListener('click', () => {
            editingPersonId = null;
            document.getElementById('modalTitle').textContent = 'Add Person';
            personForm.reset();
            openModal(editModal);
        });

        // Person form
        personForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('personName').value;
            const score = document.getElementById('personScore').value;

            if (editingPersonId) {
                await updatePerson(editingPersonId, name, score);
            } else {
                await addPerson(name, score);
            }
        });

        // Cancel buttons
        document.getElementById('cancelLoginBtn').addEventListener('click', () => {
            closeModal(loginModal);
        });

        document.getElementById('cancelEditBtn').addEventListener('click', () => {
            closeModal(editModal);
            editingPersonId = null;
        });

        // Close modals with X button
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                const modal = closeBtn.closest('.modal');
                closeModal(modal);
                editingPersonId = null;
            });
        });

        // Close modals when clicking outside (optimized for touch devices)
        window.addEventListener('click', (e) => {
            if (e.target === loginModal) closeModal(loginModal);
            if (e.target === userAuthModal) closeModal(userAuthModal);
            if (e.target === editModal) {
                closeModal(editModal);
                editingPersonId = null;
            }
            if (e.target === usernameModal) closeModal(usernameModal);
            if (e.target === newsModal) closeModal(newsModal);
        });
        
        // Touch event for mobile (better than click for modals)
        window.addEventListener('touchend', (e) => {
            if (e.target === loginModal) closeModal(loginModal);
            if (e.target === userAuthModal) closeModal(userAuthModal);
            if (e.target === editModal) {
                closeModal(editModal);
                editingPersonId = null;
            }
            if (e.target === usernameModal) closeModal(usernameModal);
            if (e.target === newsModal) closeModal(newsModal);
        }, { passive: true });

        // Filter and search listeners
        searchInput.addEventListener('input', (e) => {
            currentFilter.search = e.target.value;
            filterPeople();
        });

        letterFilter.addEventListener('change', (e) => {
            currentFilter.letter = e.target.value;
            filterPeople();
        });

        scoreFilter.addEventListener('change', (e) => {
            currentFilter.score = e.target.value;
            filterPeople();
        });

        sortBtn.addEventListener('click', toggleSort);

        // News management button
        document.getElementById('manageNewsBtn').addEventListener('click', () => {
            renderNewsList();
            openModal(newsModal);
        });

        // News form
        newsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = document.getElementById('newsText').value;
            if (text.trim()) {
                await addNews(text);
            }
        });

        // Close news modal
        document.getElementById('closeNewsModalBtn').addEventListener('click', () => {
            closeModal(newsModal);
        });

        // Close news modal with X button
        newsModal.querySelector('.close')?.addEventListener('click', () => {
            closeModal(newsModal);
        });

        // Close news modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === newsModal) {
                closeModal(newsModal);
            }
        });
    }

    // Make functions available globally for onclick handlers
    window.editPerson = editPerson;
    window.deletePerson = deletePerson;
    window.deleteNews = deleteNews;
    window.voteOnPerson = voteOnPerson;

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize on load - only once
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM already loaded
        init();
    }

