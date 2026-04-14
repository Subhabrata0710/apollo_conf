// ABC Children’s Conclave - Complete Script
// REPLACE THIS URL WITH YOUR GOOGLE APPS SCRIPT DEPLOYMENT URL
const API_URL = "https://script.google.com/macros/s/AKfycbzPnqk5zbLfpDq4xix1PvOTphyfZzTHI7gDAFKbC-wynFvaRwGd39kfrLiSQRzceFPx/exec";
const RZP_KEY = "rzp_live_SLF3GydGrlOos3";

let currentUser = null;

// =====================
// UNIVERSAL NAV INIT
// =====================
document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM Content Loaded - Initializing App");

    // Load Navigation
    const navPlaceholder = document.getElementById('navbar-placeholder');
    if (navPlaceholder) {
        console.log("Found navbar placeholder, fetching nav.html...");
        fetch('nav.html?v=' + Date.now())
            .then(response => {
                if (!response.ok) throw new Error('Nav Fetch Failed: ' + response.status);
                return response.text();
            })
            .then(data => {
                navPlaceholder.innerHTML = data;
                console.log("Nav loaded successfully");
                initNavbar();
                setActiveLink();
            })
            .catch(err => {
                console.error("Error loading navigation:", err);
                // Fallback or alert if critical
            });
    } else {
        console.log("No navbar placeholder found, initializing static navbar if exists");
        initNavbar();
        setActiveLink();
    }

    // Load Footer
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
        fetch('footer.html?v=' + Date.now())
            .then(response => response.text())
            .then(data => {
                footerPlaceholder.innerHTML = data;
                console.log("Footer loaded successfully");
            })
            .catch(err => console.error("Error loading footer:", err));
    }

    function initNavbar() {
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
    }

    function setActiveLink() {
        const path = window.location.pathname;
        const page = path.split("/").pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav-links a[data-page]');

        navLinks.forEach(link => {
            if (link.getAttribute('data-page') === page) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Show/Hide Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            if (page === 'dashboard.html' || localStorage.getItem('apollo_user')) {
                logoutBtn.style.display = 'block';
            } else {
                logoutBtn.style.display = 'none';
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
            });
        });
    }

    // Initialize Countdown if on homepage
    if (document.getElementById('countdown')) {
        initCountdown("May 8, 2026 00:00:00");
    }

    // Cache Busting for Scientific Program PDF
    const pdfPath = 'images/abc_s.pdf';
    const timestamp = Date.now();
    const bustedPdfPath = `${pdfPath}?v=${timestamp}`;

    // Update all static links to the PDF
    document.querySelectorAll(`a[href^="${pdfPath}"]`).forEach(link => {
        link.href = bustedPdfPath;
        console.log("Cache busted link:", link.href);
    });

    // Mobile PDF Modal Logic
    const downloadBtn = document.getElementById('download-btn-hero');
    const pdfModal = document.getElementById('pdfModal');
    const modalClose = document.querySelector('.modal-close');
    const pdfIframe = document.getElementById('pdfIframe');

    if (downloadBtn && pdfModal) {
        downloadBtn.addEventListener('click', function (e) {
            // Check if mobile view
            if (window.innerWidth <= 768) {
                e.preventDefault();
                if (pdfIframe) pdfIframe.src = bustedPdfPath; // Load PDF with cache buster
                pdfModal.style.display = 'flex';
                console.log("Mobile view detected - opening embedded PDF modal with cache buster");
            }
        });

        // Close modal on X click
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                pdfModal.style.display = 'none';
                if (pdfIframe) pdfIframe.src = ''; // Clear src
            });
        }

        // Close modal on outside click
        window.addEventListener('click', (e) => {
            if (e.target === pdfModal) {
                pdfModal.style.display = 'none';
                if (pdfIframe) pdfIframe.src = ''; // Clear src
            }
        });
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
    const hasConf = document.getElementById('reg-conf').checked;
    const hasCme = document.getElementById('reg-cme').checked;
    const cmeChoice = document.getElementById('reg-cme-choice').value;

    if (!name || !email || !phone || !institution || !city || !pass) {
        return alert("Please fill all required fields and password.");
    }

    if (!hasConf && !hasCme) {
        return alert("Please select at least one option: Conference Registration or CME Registration.");
    }

    if (hasCme && !cmeChoice) {
        return alert("Please select which CME session you would like to attend.");
    }

    const priceData = calculateCurrentPrice();
    const delType = priceData.delType;
    
    // Construct descriptive regType
    let regType = delType;
    if (hasConf && hasCme) {
        regType += ` (Conf + ${cmeChoice})`;
    } else if (hasConf) {
        regType += ` (Conf Only)`;
    } else if (hasCme) {
        regType += ` (${cmeChoice} Only)`;
    }

    const amount = priceData.total;

    // PGT APPROVAL FILE HANDLING
    const fileInput = document.getElementById('pgt-letter');
    let fileData = null;

    if (delType === 'PGT') {
        if (!fileInput || fileInput.files.length === 0) {
            return alert("PGT registration requires an approval letter from your HoD. Please upload the file.");
        }

        const file = fileInput.files[0];
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            return alert("Approval letter size must be less than 5MB");
        }

        showLoader(true);
        const reader = new FileReader();
        reader.onload = function (e) {
            fileData = {
                base64: e.target.result.split(',')[1],
                fileName: file.name,
                mimeType: file.type
            };
            proceedToPayment();
        };
        reader.onerror = function () {
            showLoader(false);
            alert("Failed to read the approval letter. Please try again.");
        };
        reader.readAsDataURL(file);
    } else {
        proceedToPayment();
    }

    function proceedToPayment() {
        showLoader(false);
        if (amount === 0) {
            registerBackend("FREE_REGISTRATION", regType, 0, {
                delType: delType,
                institution: institution,
                city: city,
                hasCme: hasCme,
                cmeChoice: hasCme ? cmeChoice : '',
                pgtFile: fileData
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
                    delType: delType,
                    institution: institution,
                    city: city,
                    hasCme: hasCme,
                    cmeChoice: hasCme ? cmeChoice : '',
                    pgtFile: fileData
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
}

function calculateCurrentPrice() {
    const delType = document.getElementById('reg-delegate-type')?.value || 'Standard';
    const hasConf = document.getElementById('reg-conf')?.checked || false;
    const hasCme = document.getElementById('reg-cme')?.checked || false;

    const now = new Date();
    let confPrice = 2000;
    let cmePrice = 1000;
    // let confPrice = 1;
    // let cmePrice = 1;
    if ((delType === 'Senior' || delType === 'WBAP') && (now <= new Date('2026-04-15'))) {
        return {
            total: 0,
            confPrice: 0,
            cmePrice: 0,
            delType,
            hasConf,
            hasCme
        };
    }
    // if (delType === 'testing') {
    //     confPrice = 0.01;
    //     // return {
    //     //     total: 0.1,
    //     //     confPrice: 1,
    //     //     cmePrice: 0,
    //     //     delType,
    //     //     hasCme
    //     // };
    // }
    if (now <= new Date('2026-04-14')) {
        confPrice = 2000;
        cmePrice = 1000;
        // confPrice = 0.5;
        // cmePrice = 0.5;
    } else if (now <= new Date('2026-04-26')) {
        confPrice = (delType === 'PGT') ? 1000 : (delType === 'Alumni') ? 2000 : 3000;
        cmePrice = (delType === 'PGT') ? 500 : 1000;
    } else if (now <= new Date('2026-05-06')) {
        confPrice = (delType === 'PGT' || delType === 'Alumni') ? 3000 : 4000;
        cmePrice = (delType === 'PGT' || delType === 'Alumni') ? 1000 : 2000;
    } else {
        confPrice = (delType === 'PGT' || delType === 'Alumni') ? 5000 : 6000;
        cmePrice = 3000;
    }

    let total = 0;
    if (hasConf) total += confPrice;
    if (hasCme) total += cmePrice;
    return { total, confPrice, cmePrice, delType, hasConf, hasCme };
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

    console.log("Attempting registration with data:", data);

    // Simple fetch with one retry on network failure
    const sendRequest = (retryCount = 0) => {
        fetch(API_URL, {
            method: "POST",
            body: JSON.stringify(data)
        })
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                showLoader(false);
                console.log("Registration response:", data);
                if (data.success) {
                    alert("Registration Successful! Please login to access your dashboard.");
                    window.location.href = "login.html";
                } else {
                    alert("Error: " + (data.message || "Registration failed"));
                    console.error("Registration failed:", data.message);
                }
            })
            .catch(error => {
                if (retryCount < 1) {
                    console.warn("Registration failed, retrying...", error);
                    setTimeout(() => sendRequest(retryCount + 1), 2000);
                } else {
                    showLoader(false);
                    console.error('Registration final error:', error);
                    alert("Server Error. Your payment was successful (ID: " + paymentId + "), but the registration failed to save. Please contact support with your payment ID.");
                }
            });
    };

    sendRequest();
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