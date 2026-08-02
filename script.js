/**
 * MediaGrab - Video Downloader Frontend & Backend API Integration
 * Version: 2.0.0
 * Senior Engineering Architecture
 */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // ----------------------------------------------------------------------
    // 1. DOM Element Selectors
    // ----------------------------------------------------------------------
    const videoUrlInput = document.getElementById('videoUrlInput');
    const downloadForm = document.getElementById('downloadForm');
    const processBtn = document.getElementById('processBtn');
    const pasteBtn = document.getElementById('pasteBtn');
    const clearBtn = document.getElementById('clearBtn');
    
    // States
    const loadingState = document.getElementById('loadingState');
    const loadingStepText = document.getElementById('loadingStepText');
    const progressBarFill = document.getElementById('progressBarFill');
    const progressStatusText = document.getElementById('progressStatusText');
    const progressPercentageText = document.getElementById('progressPercentageText');
    const cancelProcessBtn = document.getElementById('cancelProcessBtn');
    
    const errorState = document.getElementById('errorState');
    const errorTitle = document.getElementById('errorTitle');
    const errorMessage = document.getElementById('errorMessage');
    const closeErrorBtn = document.getElementById('closeErrorBtn');

    const previewCard = document.getElementById('previewCard');
    const closePreviewBtn = document.getElementById('closePreviewBtn');
    const previewVideoTitle = document.getElementById('previewVideoTitle');
    const previewDuration = document.getElementById('previewDuration');
    const previewAuthor = document.getElementById('previewAuthor');
    const previewViews = document.getElementById('previewViews');
    const previewPlatform = document.getElementById('previewPlatform');
    const previewThumbnailImg = document.getElementById('previewThumbnailImg');
    const formatOptionsGrid = document.getElementById('formatOptionsGrid');
    const startDownloadBtn = document.getElementById('startDownloadBtn');
    const downloadBtnText = document.getElementById('downloadBtnText');
    const copyDirectLinkBtn = document.getElementById('copyDirectLinkBtn');
    const downloadSubtitleBtn = document.getElementById('downloadSubtitleBtn');

    // Controls & Navigation
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const navLinks = document.getElementById('navLinks');
    const toastContainer = document.getElementById('toastContainer');
    const contactForm = document.getElementById('contactForm');

    // Simulation Mode Buttons
    const simSuccessBtn = document.getElementById('simSuccessBtn');
    const simInvalidBtn = document.getElementById('simInvalidBtn');
    const simNetworkErrBtn = document.getElementById('simNetworkErrBtn');

    let currentSimulationMode = 'success'; // 'success' | 'invalid' | 'network_error'
    let processInterval = null;
    let activeVideoData = null;
    let selectedQualityFormat = '4k';

    // ----------------------------------------------------------------------
    // 2. Initial Setup & Theme Controller
    // ----------------------------------------------------------------------
    initTheme();

    function initTheme() {
        const savedTheme = localStorage.getItem('mediagrab_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('mediagrab_theme', newTheme);
            showToast('info', 'Theme Switched', `Switched to ${newTheme.toUpperCase()} mode.`);
        });
    }

    // ----------------------------------------------------------------------
    // 3. Mobile Navigation Menu
    // ----------------------------------------------------------------------
    if (hamburgerBtn && navLinks) {
        hamburgerBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburgerBtn.classList.toggle('active');
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }

    // ----------------------------------------------------------------------
    // 4. Input Helpers (Paste, Clear, Focus)
    // ----------------------------------------------------------------------
    videoUrlInput.addEventListener('input', () => {
        if (videoUrlInput.value.trim().length > 0) {
            clearBtn.style.display = 'inline-flex';
            videoUrlInput.parentElement.classList.remove('input-error');
        } else {
            clearBtn.style.display = 'none';
        }
    });

    clearBtn.addEventListener('click', () => {
        videoUrlInput.value = '';
        clearBtn.style.display = 'none';
        videoUrlInput.focus();
        hideAllStates();
    });

    pasteBtn.addEventListener('click', async () => {
        try {
            if (navigator.clipboard && navigator.clipboard.readText) {
                const text = await navigator.clipboard.readText();
                if (text) {
                    videoUrlInput.value = text.trim();
                    clearBtn.style.display = 'inline-flex';
                    showToast('success', 'Pasted', 'URL pasted from clipboard.');
                    videoUrlInput.focus();
                } else {
                    showToast('warning', 'Clipboard Empty', 'No text found in your clipboard.');
                }
            } else {
                showToast('info', 'Manual Paste Required', 'Press Ctrl+V to paste the link into the input field.');
            }
        } catch (err) {
            showToast('info', 'Clipboard Access', 'Press Ctrl+V or Command+V to paste your video link.');
        }
    });

    // Sample Link Pills Click Listener
    document.querySelectorAll('.sample-pill').forEach(pill => {
        pill.addEventListener('click', (e) => {
            const sampleUrl = pill.getAttribute('data-url');
            videoUrlInput.value = sampleUrl;
            clearBtn.style.display = 'inline-flex';
            hideAllStates();
            showToast('info', 'Sample URL Loaded', 'Click Download Now to process.');
            videoUrlInput.focus();
        });
    });

    // Simulation Mode Handlers
    if (simSuccessBtn) simSuccessBtn.addEventListener('click', () => setSimMode('success', simSuccessBtn));
    if (simInvalidBtn) simInvalidBtn.addEventListener('click', () => setSimMode('invalid', simInvalidBtn));
    if (simNetworkErrBtn) simNetworkErrBtn.addEventListener('click', () => setSimMode('network_error', simNetworkErrBtn));

    function setSimMode(mode, targetBtn) {
        currentSimulationMode = mode;
        document.querySelectorAll('.sim-btn').forEach(btn => btn.classList.remove('active'));
        targetBtn.classList.add('active');
        showToast('info', 'Mode Changed', `Demo set to: ${mode.replace('_', ' ').toUpperCase()}`);
    }

    // ----------------------------------------------------------------------
    // 5. Form Processing & API Integration (POST /api/video-info)
    // ----------------------------------------------------------------------
    downloadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rawUrl = videoUrlInput.value.trim();

        hideAllStates();

        if (!rawUrl) {
            showInputError('Please enter a video URL to proceed.');
            showToast('error', 'URL Required', 'Please paste a valid video URL into the input field.');
            return;
        }

        if (currentSimulationMode === 'invalid') {
            showInputError('Simulated invalid URL error.');
            showErrorState('Invalid Video Link', 'Simulated invalid URL error triggered by developer mode toolbar.');
            showToast('error', 'Invalid Link', 'Simulated error state active.');
            return;
        }

        // Trigger Loading Animation and Call Backend API
        triggerLoadingState(async () => {
            try {
                const response = await fetch('/api/video-info', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: rawUrl })
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    showErrorState(
                        'Video Extraction Failed', 
                        data.message || 'Unable to fetch video metadata from the provided URL.'
                    );
                    showToast('error', 'API Error', data.message || 'Server extraction error.');
                    return;
                }

                activeVideoData = data.data;
                renderPreviewCardWithApiData(data.data);
            } catch (networkErr) {
                showErrorState(
                    'Network Connection Error', 
                    'Failed to reach the backend API server. Make sure node backend server is running on port 5000.'
                );
                showToast('error', 'Backend Unavailable', 'Could not connect to /api/video-info endpoint.');
            }
        });
    });

    function showInputError(msg) {
        videoUrlInput.parentElement.classList.add('input-error');
        videoUrlInput.focus();
    }

    // ----------------------------------------------------------------------
    // 6. Loading Animation Progress Controller
    // ----------------------------------------------------------------------
    function triggerLoadingState(onCompleteCallback) {
        loadingState.style.display = 'flex';
        processBtn.disabled = true;
        
        let progress = 0;
        progressBarFill.style.width = '0%';
        progressPercentageText.textContent = '0%';

        const steps = [
            { pct: 25, title: 'Connecting to backend API...', sub: 'POST /api/video-info' },
            { pct: 60, title: 'Extracting platform media tags...', sub: 'Fetching resolution formats & thumbnail' },
            { pct: 90, title: 'Generating downloadable codecs...', sub: 'Formatting MP4 / MP3 response payload' },
            { pct: 100, title: 'Extraction complete!', sub: 'Rendering video preview card' }
        ];

        let currentStepIdx = 0;
        if (processInterval) clearInterval(processInterval);

        processInterval = setInterval(() => {
            progress += Math.floor(Math.random() * 10) + 5;
            if (progress > 100) progress = 100;

            progressBarFill.style.width = `${progress}%`;
            progressPercentageText.textContent = `${progress}%`;

            if (currentStepIdx < steps.length && progress >= steps[currentStepIdx].pct) {
                loadingStepText.textContent = steps[currentStepIdx].title;
                progressStatusText.textContent = steps[currentStepIdx].sub;
                currentStepIdx++;
            }

            if (progress >= 100) {
                clearInterval(processInterval);
                setTimeout(() => {
                    loadingState.style.display = 'none';
                    processBtn.disabled = false;
                    onCompleteCallback();
                }, 300);
            }
        }, 100);
    }

    if (cancelProcessBtn) {
        cancelProcessBtn.addEventListener('click', () => {
            if (processInterval) clearInterval(processInterval);
            loadingState.style.display = 'none';
            processBtn.disabled = false;
            showToast('warning', 'Process Cancelled', 'Video URL extraction was stopped.');
        });
    }

    // ----------------------------------------------------------------------
    // 7. Preview Card API Renderer
    // ----------------------------------------------------------------------
    function renderPreviewCardWithApiData(apiData) {
        hideAllStates();

        if (previewVideoTitle) previewVideoTitle.textContent = apiData.title;
        if (previewDuration) previewDuration.innerHTML = `<i class="fa-regular fa-clock"></i> ${apiData.duration}`;
        if (previewAuthor) previewAuthor.textContent = apiData.author;
        if (previewViews) previewViews.textContent = apiData.views;
        if (previewPlatform) previewPlatform.textContent = apiData.platform;

        if (apiData.thumbnail && previewThumbnailImg) {
            previewThumbnailImg.src = apiData.thumbnail;
        }

        if (apiData.availableQualities && apiData.availableQualities.length > 0) {
            renderFormatOptions(apiData.availableQualities);
        }

        previewCard.style.display = 'block';
        previewCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        showToast('success', 'Metadata Loaded', 'Select format and click Download.');
    }

    function renderFormatOptions(qualities) {
        formatOptionsGrid.innerHTML = '';
        qualities.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = `format-option-card ${index === 0 ? 'active' : ''}`;
            card.setAttribute('data-quality', item.quality);
            card.setAttribute('data-size', item.estimatedSize);

            let iconClass = 'fa-film';
            if (item.quality === '4k') iconClass = 'fa-display';
            else if (item.quality === '1080p') iconClass = 'fa-tv';
            else if (item.quality === '720p') iconClass = 'fa-mobile-screen';
            else if (item.quality === 'mp3') iconClass = 'fa-music';

            card.innerHTML = `
                <div class="format-icon"><i class="fa-solid ${iconClass}"></i></div>
                <div class="format-info">
                    <span class="format-resolution">${item.resolution}</span>
                    <span class="format-sub">${item.label}</span>
                </div>
                <span class="format-size">${item.estimatedSize}</span>
            `;

            card.addEventListener('click', () => {
                formatOptionsGrid.querySelectorAll('.format-option-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                selectedQualityFormat = item.quality;
                downloadBtnText.textContent = `Download Selected (${item.resolution} - ${item.estimatedSize})`;
            });

            formatOptionsGrid.appendChild(card);
        });

        if (qualities.length > 0) {
            selectedQualityFormat = qualities[0].quality;
            downloadBtnText.textContent = `Download Selected (${qualities[0].resolution} - ${qualities[0].estimatedSize})`;
        }
    }

    closePreviewBtn.addEventListener('click', () => {
        previewCard.style.display = 'none';
    });

    // ----------------------------------------------------------------------
    // 8. Download Execution Handler (POST /api/download)
    // ----------------------------------------------------------------------
    startDownloadBtn.addEventListener('click', async () => {
        const rawUrl = videoUrlInput.value.trim();

        if (!rawUrl) {
            showToast('error', 'Error', 'No video URL provided.');
            return;
        }

        const origText = downloadBtnText.textContent;
        downloadBtnText.textContent = "Requesting Stream Link...";
        startDownloadBtn.disabled = true;

        try {
            const response = await fetch('/api/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    url: rawUrl, 
                    quality: selectedQualityFormat 
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                showToast('error', 'Download Error', data.message || 'Failed to generate download link.');
                return;
            }

            const downloadInfo = data.data.download;
            showToast('success', 'Download Started', `Downloading ${downloadInfo.fileName}`);

            const link = document.createElement('a');
            link.href = downloadInfo.directDownloadUrl;
            link.setAttribute('download', downloadInfo.fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            showToast('error', 'Connection Failure', 'Failed to reach POST /api/download backend service.');
        } finally {
            startDownloadBtn.disabled = false;
            downloadBtnText.textContent = origText;
        }
    });

    copyDirectLinkBtn.addEventListener('click', () => {
        if (activeVideoData && activeVideoData.url) {
            navigator.clipboard.writeText(activeVideoData.url);
            showToast('info', 'Direct Link Copied', 'Video URL copied to clipboard.');
        } else {
            showToast('info', 'Direct Link Copied', 'Sample stream link copied.');
        }
    });

    downloadSubtitleBtn.addEventListener('click', () => {
        showToast('info', 'Subtitles Hook', 'Subtitles requested from backend service.');
    });

    // ----------------------------------------------------------------------
    // 9. Error & Helper State Managers
    // ----------------------------------------------------------------------
    function showErrorState(title, message) {
        errorTitle.textContent = title;
        errorMessage.textContent = message;
        errorState.style.display = 'flex';
    }

    closeErrorBtn.addEventListener('click', () => {
        errorState.style.display = 'none';
    });

    function hideAllStates() {
        loadingState.style.display = 'none';
        errorState.style.display = 'none';
        previewCard.style.display = 'none';
    }

    // ----------------------------------------------------------------------
    // 10. FAQ Accordion Logic
    // ----------------------------------------------------------------------
    document.querySelectorAll('.faq-item').forEach(item => {
        const questionBtn = item.querySelector('.faq-question');
        questionBtn.addEventListener('click', () => {
            const isOpen = item.classList.contains('open');
            document.querySelectorAll('.faq-item').forEach(other => other.classList.remove('open'));
            if (!isOpen) item.classList.add('open');
        });
    });

    // ----------------------------------------------------------------------
    // 11. Contact Form Handler
    // ----------------------------------------------------------------------
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('contactSubmitBtn');
            const origHtml = submitBtn.innerHTML;
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';

            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = origHtml;
                contactForm.reset();
                showToast('success', 'Message Sent', 'Thank you for reaching out! Our backend team received your note.');
            }, 1000);
        });
    }

    // ----------------------------------------------------------------------
    // 12. Toast Notification Engine
    // ----------------------------------------------------------------------
    function showToast(type, title, message) {
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let iconClass = 'fa-circle-info';
        if (type === 'success') iconClass = 'fa-circle-check';
        if (type === 'error') iconClass = 'fa-circle-exclamation';
        if (type === 'warning') iconClass = 'fa-triangle-exclamation';

        toast.innerHTML = `
            <i class="fa-solid ${iconClass} toast-icon"></i>
            <div class="toast-body">
                <strong class="toast-title" style="display:block; font-size:0.88rem;">${title}</strong>
                <span class="toast-message" style="font-size:0.8rem; opacity:0.9;">${message}</span>
            </div>
        `;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 350);
        }, 4000);
    }
});
