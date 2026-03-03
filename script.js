// ABC Children’s Conclave - Complete Script
// REPLACE THIS URL WITH YOUR GOOGLE APPS SCRIPT DEPLOYMENT URL
const API_URL = "https://script.google.com/macros/s/AKfycbzA4SnqhGnWL_kyvAMoM8EyqPgxx9n4kj-PXEjxI8AjHJWvKmkVFMDdXxcfDZFw7kKE/exec";
const RZP_KEY = "rzp_live_SLF3GydGrlOos3";

let currentUser = null;

// =====================
// UNIVERSAL NAV INIT
// =====================
document.addEventListener("DOMContentLoaded", function () {
    // Navbar scroll effect
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 100) navbar.classList.add('scrolled');
            else navbar.classList.remove('scrolled');
        });
    }

    // Burger menu toggle
    const burger = document.getElementById("burger");
    const navMenu = document.getElementById("navMenu");
    if (burger && navMenu) {
        burger.addEventListener("click", function () {
            navMenu.classList.toggle("open");
            burger.classList.toggle("active");
        });
        // Close on link click
        navMenu.querySelectorAll('a:not(.more-link)').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('open');
                burger.classList.remove('active');
            });
        });
        // Mobile "More" dropdown toggle
        const moreDropdown = document.getElementById("moreDropdown");
        if (moreDropdown) {
            const moreLink = moreDropdown.querySelector('.more-link');
            if (moreLink) {
                moreLink.addEventListener('click', function (e) {
                    if (window.innerWidth <= 768) {
                        e.preventDefault();
                        moreDropdown.classList.toggle('open');
                    }
                });
            }
        }
    }

    // Smooth scroll for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href.startsWith('#') && href.length > 1) {
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });

    // Program tabs functionality (if on page)
    const tabs = document.querySelectorAll('.tab-btn');
    if (tabs.length > 0) {
        tabs.forEach(tab => {
            tab.addEventListener('click', function () {
                tabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                // Tab content switching logic can be added here
            });
        });
    }

    // Initialize Countdown if on homepage
    if (document.getElementById('countdown')) {
        initCountdown("May 8, 2026 00:00:00");
    }
});

// =====================
// UTILITY FUNCTIONS
// =====================

// Show/Hide Loader
function showLoader(show) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

// Check Authentication
function checkAuth() {
    const userEmail = localStorage.getItem('userEmail');
    const userName = localStorage.getItem('userName');
    const userType = localStorage.getItem('userType');
    const userToken = localStorage.getItem('userToken');

    if (!userEmail || !userName) {
        // Not logged in, redirect to login
        if (window.location.pathname.includes('dashboard.html')) {
            alert('Please login to access the dashboard');
            window.location.href = 'login.html';
        }
        return false;
    }

    // User is logged in
    currentUser = {
        email: userEmail,
        name: userName,
        type: userType || 'Standard',
        token: userToken || userEmail
    };

    // Update dashboard if on dashboard page
    if (window.location.pathname.includes('dashboard.html')) {
        updateDashboard();
        loadFiles();
    }

    return true;
}

// Update Dashboard with User Info
function updateDashboard() {
    if (!currentUser) return;

    const welcomeEl = document.getElementById('user-welcome');
    const nameEl = document.getElementById('user-name');
    const emailEl = document.getElementById('user-email');
    const typeEl = document.getElementById('user-type');
    const regIdEl = document.getElementById('reg-id');
    const regTypeEl = document.getElementById('reg-type');

    if (welcomeEl) welcomeEl.textContent = `Welcome, ${currentUser.name}`;
    if (nameEl) nameEl.textContent = currentUser.name;
    if (emailEl) emailEl.textContent = currentUser.email;
    if (typeEl) typeEl.textContent = currentUser.type + ' Delegate';
    if (regIdEl) regIdEl.textContent = generateRegId(currentUser.email);
    if (regTypeEl) regTypeEl.textContent = currentUser.type;
}

// Generate Registration ID from email
function generateRegId(email) {
    return 'ABC2026-' + email.substring(0, 3).toUpperCase() +
        Math.floor(Math.random() * 10000).toString().padStart(4, '0');
}

// =====================
// REGISTRATION FUNCTIONS
// =====================

// Payment & Registration (Updated for 4 pricing tiers)
function payAndRegister() {
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const phone = document.getElementById('reg-phone').value;
    const institution = document.getElementById('reg-institution').value;
    const city = document.getElementById('reg-city').value;
    const pass = document.getElementById('reg-password').value;
    const hasCme = document.getElementById('reg-cme').checked;
    const cmeChoice = document.getElementById('reg-cme-choice').value;

    if (!name || !email || !phone || !institution || !city || !pass) {
        return alert("Please fill all required fields and password.");
    }

    if (hasCme && !cmeChoice) {
        return alert("Please select which CME session you would like to attend.");
    }

    const priceData = calculateCurrentPrice();
    const regType = `${priceData.delType}${hasCme ? ' + ' + cmeChoice : ''}`;
    const amount = priceData.total;
    if (amount === 0) {
        registerBackend("FREE_REGISTRATION", regType, 0, {
            delType: priceData.delType,
            institution: institution,
            city: city,
            hasCme: hasCme,
            cmeChoice: hasCme ? cmeChoice : ''
        });
        return;
    }
    ////////////////////////////////////////////////// PROD PAYMENT/////////////////////////////
    var options = {
        "key": RZP_KEY,
        "amount": amount * 100,
        "currency": "INR",
        "name": "ABC Children’s Conclave",
        "description": `${regType} Registration`,
        "handler": function (response) {
            registerBackend(response.razorpay_payment_id, regType, amount, {
                delType: priceData.delType,
                institution: institution,
                city: city,
                hasCme: hasCme,
                cmeChoice: hasCme ? cmeChoice : ''
            });
        },
        "prefill": {
            "name": name,
            "email": email,
            "contact": phone
        },
        "theme": {
            "color": "#003A8C"
        }
    };

    // Open Razorpay
    var rzp1 = new Razorpay(options);
    rzp1.on('payment.failed', function (response) {
        alert("Payment Failed: " + response.error.description);
    });
    rzp1.open();
}






function calculateCurrentPrice() {
    const delType = document.getElementById('reg-delegate-type')?.value || 'Standard';
    const hasCme = document.getElementById('reg-cme')?.checked || false;

    const now = new Date();
    let confPrice = 2000;
    let cmePrice = 1000;
    // let confPrice = 1;
    // let cmePrice = 1;
    if (delType === 'Senior') {
        return {
            total: 0,
            confPrice: 0,
            cmePrice: 0,
            delType,
            hasCme
        };
    }
    if (now <= new Date('2026-03-14')) {
        confPrice = 2000;
        cmePrice = 1000;
        // confPrice = 0.5;
        // cmePrice = 0.5;
    } else if (now <= new Date('2026-04-14')) {
        confPrice = (delType === 'PGT') ? 2000 : 3000;
        cmePrice = 1000;
    } else if (now <= new Date('2026-05-05')) {
        confPrice = (delType === 'PGT') ? 3000 : 4000;
        cmePrice = 1000;
    } else {
        confPrice = (delType === 'PGT') ? 5000 : 6000;
        cmePrice = 2000;
    }

    let total = confPrice;
    if (hasCme) total += cmePrice;
    return { total, confPrice, cmePrice, delType, hasCme };
}

// function payAndRegister() {
//     const name = document.getElementById('reg-name').value;
//     const email = document.getElementById('reg-email').value;
//     const phone = document.getElementById('reg-phone').value;
//     const institution = document.getElementById('reg-institution').value;
//     const city = document.getElementById('reg-city').value;
//     const pass = document.getElementById('reg-password').value;
//     const hasCme = document.getElementById('reg-cme').checked;
//     const cmeChoice = document.getElementById('reg-cme-choice').value;

//     if (!name || !email || !phone || !institution || !city || !pass) {
//         return alert("Please fill all required fields and password.");
//     }
//////////////////test payment////////////
//     if (hasCme && !cmeChoice) {
//         return alert("Please select which CME session you would like to attend.");
//     }

//     const priceData = calculateCurrentPrice();
//     const regType = `${priceData.delType}${hasCme ? ' + ' + cmeChoice : ''}`;

//     // 🚀 Payment Bypass for Testing
//     registerBackend("TEST_PAYMENT", regType, priceData.total, {
//         delType: priceData.delType,
//         institution: institution,
//         city: city,
//         hasCme: hasCme,
//         cmeChoice: hasCme ? cmeChoice : 'None'
//     });
// }







function registerBackend(paymentId, regType, amount, extra) {
    showLoader(true);

    const data = {
        action: 'register',
        name: document.getElementById('reg-name').value,
        email: document.getElementById('reg-email').value,
        phone: document.getElementById('reg-phone').value,
        password: document.getElementById('reg-password').value,
        amount: amount,
        regType: regType,
        paymentId: paymentId,
        ...extra
    };

    fetch(API_URL, {
        method: "POST",
        body: JSON.stringify(data)
    })
        .then(res => res.json())
        .then(data => {
            showLoader(false);
            if (data.success) {
                alert("Registration Successful! Please login to access your dashboard.");
                window.location.href = "login.html";
            } else {
                alert("Error: " + (data.message || "Registration failed"));
            }
        })
        .catch(error => {
            showLoader(false);
            console.error('Registration error:', error);
            alert("Server Error. Please try again later.");
        });
}

// =====================
// LOGIN FUNCTIONS
// =====================

// function loginUser() {
//     const email = document.getElementById('login-email').value;
//     const password = document.getElementById('login-password').value;

//     if(!email || !password) {
//         return alert("Please fill all fields");
//     }

//     showLoader(true);

//     const data = {
//         action: 'login',
//         email: email,
//         password: password
//     };

//     fetch(API_URL, {
//         method: "POST",
//         body: JSON.stringify(data)
//     })
//     .then(res => res.json())
//     .then(data => {
//         showLoader(false);
//         if(data.success) {
//             // Store user info in localStorage
//             localStorage.setItem('userEmail', email);
//             localStorage.setItem('userName', data.name || email.split('@')[0]);
//             localStorage.setItem('userType', data.type || 'Standard');
//             localStorage.setItem('userToken', data.token || email);

//             // Redirect to dashboard
//             window.location.href = "dashboard.html";
//         } else {
//             alert("Login Failed: " + (data.message || "Invalid credentials"));
//         }
//     })
//     .catch(error => {
//         showLoader(false);
//         console.error('Login error:', error);
//         alert("Server Error. Please try again later.");
//     });
// }


function loginUser() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        return alert("Please fill all fields");
    }

    // 🚀 Backend Bypass for Testing
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userName', email.split('@')[0]);
    localStorage.setItem('userType', 'Standard');
    localStorage.setItem('userToken', email);

    window.location.href = "dashboard.html";
}







// Logout
function logout() {
    // Clear localStorage
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userType');
    localStorage.removeItem('userToken');

    currentUser = null;

    // Redirect to home
    alert('You have been logged out successfully');
    window.location.href = 'index.html';
}

// =====================
// FILE UPLOAD FUNCTIONS
// =====================

function uploadFile() {
    const fileInput = document.getElementById('file-upload');

    if (!fileInput || fileInput.files.length === 0) {
        alert("Please select a file first");
        return;
    }

    const file = fileInput.files[0];

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
    }

    showLoader(true);

    const reader = new FileReader();
    reader.onload = function (e) {
        const base64 = e.target.result.split(',')[1];

        const payload = {
            action: 'upload',
            userId: currentUser.token,
            userName: currentUser.name,
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
            fileData: base64
        };

        fetch(API_URL, {
            method: "POST",
            body: JSON.stringify(payload)
        })
            .then(res => res.json())
            .then(response => {
                showLoader(false);
                if (response.success) {
                    document.getElementById('upload-status').innerHTML =
                        `<span style="color: #22c55e;">✓ ${file.name} uploaded successfully!</span>`;

                    // Clear file input
                    fileInput.value = '';

                    // Reload files
                    loadFiles();
                } else {
                    alert("Upload failed: " + (response.message || "Unknown error"));
                }
            })
            .catch(error => {
                showLoader(false);
                console.error('Upload error:', error);
                alert("Upload failed. Please try again.");
            });
    };

    reader.onerror = function () {
        showLoader(false);
        alert("Failed to read file");
    };

    reader.readAsDataURL(file);
}







// =====================
// FILE MANAGEMENT
// =====================

function loadFiles() {
    if (!currentUser) return;

    const payload = {
        action: 'getFiles',
        userId: currentUser.token
    };

    fetch(API_URL, {
        method: "POST",
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(response => {
            const fileList = document.getElementById('file-list');

            if (!response.success || !response.files || response.files.length === 0) {
                fileList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <p>No files uploaded yet</p>
                    <p class="text-muted">Upload your first document above</p>
                </div>
            `;
                return;
            }

            fileList.innerHTML = '';

            response.files.forEach(file => {
                const fileExt = file.name.split('.').pop().toLowerCase();
                const fileIcon = getFileIcon(fileExt);
                const fileSize = formatFileSize(file.size || 0);
                const fileDate = file.date ? new Date(file.date).toLocaleDateString() : 'Recently';

                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                fileItem.innerHTML = `
                <div class="file-info">
                    <div class="file-icon">${fileIcon}</div>
                    <div class="file-details">
                        <h4>${file.name}</h4>
                        <p>${fileSize} • Uploaded on ${fileDate}</p>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="file-action-btn" onclick="downloadFile('${file.url}')" title="Download">
                        ⬇
                    </button>
                    <button class="file-action-btn" onclick="viewFile('${file.url}')" title="View">
                        👁
                    </button>
                    <button class="file-action-btn" onclick="deleteFile('${file.id || file.name}')" title="Delete">
                        🗑
                    </button>
                </div>
            `;

                fileList.appendChild(fileItem);
            });
        })
        .catch(error => {
            console.error('Load files error:', error);
            const fileList = document.getElementById('file-list');
            fileList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <p>Failed to load files</p>
                <p class="text-muted">Please refresh the page</p>
            </div>
        `;
        });
}

// Get file icon based on extension
function getFileIcon(ext) {
    const icons = {
        'pdf': '📄',
        'doc': '📝',
        'docx': '📝',
        'ppt': '📊',
        'pptx': '📊',
        'xls': '📈',
        'xlsx': '📈',
        'jpg': '🖼',
        'jpeg': '🖼',
        'png': '🖼',
        'gif': '🖼',
        'zip': '📦',
        'rar': '📦'
    };
    return icons[ext] || '📁';
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Download file
function downloadFile(url) {
    if (!url) {
        alert("File URL not available");
        return;
    }
    window.open(url, '_blank');
}

// View file
function viewFile(url) {
    if (!url) {
        alert("File URL not available");
        return;
    }
    window.open(url, '_blank');
}

// Delete file
function deleteFile(fileId) {
    if (!confirm('Are you sure you want to delete this file?')) {
        return;
    }

    showLoader(true);

    const payload = {
        action: 'deleteFile',
        userId: currentUser.token,
        fileId: fileId
    };

    fetch(API_URL, {
        method: "POST",
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(response => {
            showLoader(false);
            if (response.success) {
                alert('File deleted successfully');
                loadFiles();
            } else {
                alert('Failed to delete file: ' + (response.message || 'Unknown error'));
            }
        })
        .catch(error => {
            showLoader(false);
            console.error('Delete error:', error);
            alert('Failed to delete file. Please try again.');
        });
}

// =====================
// COUNTDOWN TIMER
// =====================
function initCountdown(targetDate) {
    const countdownDate = new Date(targetDate).getTime();

    const updateTimer = () => {
        const now = new Date().getTime();
        const distance = countdownDate - now;

        if (distance < 0) {
            const container = document.querySelector('.countdown-container');
            if (container) container.style.display = 'none';
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        const daysEl = document.getElementById("days");
        const hoursEl = document.getElementById("hours");
        const minutesEl = document.getElementById("minutes");
        const secondsEl = document.getElementById("seconds");

        if (daysEl) daysEl.innerText = days.toString().padStart(2, '0');
        if (hoursEl) hoursEl.innerText = hours.toString().padStart(2, '0');
        if (minutesEl) minutesEl.innerText = minutes.toString().padStart(2, '0');
        if (secondsEl) secondsEl.innerText = seconds.toString().padStart(2, '0');
    };

    updateTimer();
    setInterval(updateTimer, 1000);
}

// Check authentication on page load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', function () {
        checkAuth();
    });
}

// program schedule

const tabs = document.querySelectorAll('.tab-btn');
const timelines = document.querySelectorAll('.program-timeline');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {

        const day = tab.getAttribute('data-day');

        // remove active from all buttons
        tabs.forEach(btn => btn.classList.remove('active'));
        tab.classList.add('active');

        // hide all timelines
        timelines.forEach(tl => tl.classList.remove('active'));

        // show selected timeline
        document.querySelector('.program-timeline[data-day="' + day + '"]')
            .classList.add('active');
    });
});