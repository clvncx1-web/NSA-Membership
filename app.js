// ==========================================================================
// Netball South Africa — 4 Official Card Types Data Management System
// 1. National Grading Umpire's Ticket (Yellow Block - Grade A to E)
// 2. Provincial Grading Umpire's Ticket (Red Block - Grade A to E)
// 3. Technical Official Theory Result Card (Blue Blocks - Level 1 & 2)
// 4. National Theory Result Card (Green Blocks - Level 1, 2 & 3)
// ==========================================================================

let members = [
    {
        id: "ZA-NAT-UMP-802",
        firstName: "Elish",
        surname: "Majola",
        idNumber: "8610066376086",
        province: "Gauteng",
        district: "Gauteng",
        nuaNumber: "802",
        cardType: "national_grading",
        gradeLetter: "C",
        validityYears: "2024 - 2027",
        issueDate: "2024-01-15",
        expiryDate: "2027-01-15",
        status: "Active",
        token: "TOK-89F12A",
        lastAudit: "National Grading 2024 Approved"
    },
    {
        id: "ZA-FS-UMP-2026-0044",
        firstName: "Frané",
        surname: "Van Niekerk",
        idNumber: "9708050164085",
        province: "Free State",
        district: "MMED",
        nuaNumber: "",
        cardType: "provincial_grading",
        gradeLetter: "D",
        validityYears: "2026 - 2029",
        issueDate: "2026-02-01",
        expiryDate: "2029-02-01",
        status: "Active",
        token: "TOK-33B91C",
        lastAudit: "Provincial Grading 2026 Approved"
    },
    {
        id: "ZA-TSH-TECH-2025-0108",
        firstName: "Neo",
        surname: "Koele",
        idNumber: "8601080585083",
        province: "Gauteng",
        district: "TSHWANE",
        nuaNumber: "",
        cardType: "technical_theory",
        level1Year: "2025",
        level1Score: "74%",
        level2Year: "",
        level2Score: "%",
        issueDate: "2025-03-10",
        expiryDate: "2028-03-10",
        status: "Active",
        token: "TOK-77A40F",
        lastAudit: "Technical Official Level 1 Passed"
    },
    {
        id: "ZA-TSH-THEORY-2023-0019",
        firstName: "Bonolo Lethabo",
        surname: "Bokaba",
        idNumber: "0303070120082",
        province: "Gauteng",
        district: "Tshwane",
        nuaNumber: "",
        cardType: "national_theory",
        level1Year: "2023",
        level1Score: "78%",
        level2Year: "",
        level2Score: "%",
        level3Year: "",
        level3Score: "%",
        issueDate: "2023-08-01",
        expiryDate: "2026-08-01",
        status: "Active",
        token: "TOK-11E88B",
        lastAudit: "National Theory Level 1 Passed (78%)"
    }
];

let currentRole = "Central Admin";
let currentRegistryCardType = "national_grading"; // Active sub-tab
let selectedMemberIdsForBatch = new Set();

const CARD_TYPE_META = {
    "national_grading": {
        label: "National Grading",
        fullTitle: "National Grading Umpires (Yellow Block)",
        indicatorColor: "#fde047"
    },
    "provincial_grading": {
        label: "Provincial Grading",
        fullTitle: "Provincial Grading Umpires (Red Block)",
        indicatorColor: "#f87171"
    },
    "technical_theory": {
        label: "Technical Official Theory",
        fullTitle: "Technical Official Theory Result Card (Blue Blocks)",
        indicatorColor: "#38bdf8"
    },
    "national_theory": {
        label: "National Theory",
        fullTitle: "National Theory Result Card (Green Blocks)",
        indicatorColor: "#34d399"
    }
};

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
    const savedData = localStorage.getItem("nsa_sports_members_db_v3");
    if (savedData) {
        try { members = JSON.parse(savedData); } catch(e) {}
    }
    
    switchRegistryCardType("national_grading");
    renderBatchSelectionList();
    
    if (members.length > 0) {
        selectedMemberIdsForBatch.add(members[0].id);
    }
    renderPrintCards();

    // Initialize Cloud Database listeners & sync
    initCloudDB();
});

// ==========================================================================
// CLOUD DATABASE INTEGRATION (GOOGLE FIRESTORE)
// ==========================================================================
async function initCloudDB() {
    window.addEventListener("cloud-db-status", (e) => {
        updateCloudDBStatusUI(e.detail.connected, e.detail.projectId);
    });

    window.onCloudDataLoaded = (cloudMembers) => {
        if (cloudMembers && Array.isArray(cloudMembers) && cloudMembers.length > 0) {
            members = cloudMembers;
            saveToLocalStorage();
            renderTable();
            renderBatchSelectionList();
            renderPrintCards();
        }
    };

    // If CloudDB is already initialized
    if (window.CloudDB && window.CloudDB.isConnected()) {
        const config = window.CloudDB.getActiveConfig();
        updateCloudDBStatusUI(true, config ? config.projectId : "");
        const cloudMembers = await window.CloudDB.loadMembers();
        if (cloudMembers && cloudMembers.length > 0) {
            members = cloudMembers;
            saveToLocalStorage();
            renderTable();
            renderBatchSelectionList();
            renderPrintCards();
        }
        // Start real-time sync across devices
        window.CloudDB.startRealtimeSync((liveMembers) => {
            if (liveMembers && liveMembers.length > 0) {
                members = liveMembers;
                saveToLocalStorage();
                renderTable();
                renderBatchSelectionList();
                renderPrintCards();
            }
        });
    } else {
        updateCloudDBStatusUI(false);
    }
}

function updateCloudDBStatusUI(connected, projectId = "") {
    const pill = document.getElementById("dbStatusPill");
    const text = document.getElementById("dbStatusText");
    const modalDot = document.getElementById("modalDbDot");
    const banner = document.getElementById("dbStatusBanner");
    const title = document.getElementById("dbBannerTitle");
    const desc = document.getElementById("dbBannerText");
    const syncBtn = document.getElementById("syncToCloudBtn");
    const disconnBtn = document.getElementById("disconnectDbBtn");

    if (connected) {
        if (pill) {
            pill.className = "db-status-pill connected";
            pill.title = `Connected to Cloud Firestore (${projectId}). Click for settings.`;
        }
        if (text) text.textContent = "Cloud DB Online";
        if (modalDot) modalDot.className = "db-status-dot connected";
        if (banner) banner.className = "db-banner-connected";
        if (title) title.textContent = `🟢 Connected to Google Cloud Firestore (${projectId})`;
        if (desc) desc.textContent = "All member additions, edits, and imports automatically sync to your cloud database in real time.";
        if (syncBtn) syncBtn.style.display = "inline-flex";
        if (disconnBtn) disconnBtn.style.display = "inline-flex";
    } else {
        if (pill) {
            pill.className = "db-status-pill local";
            pill.title = "Operating in Local Browser Storage. Click to connect Cloud Database.";
        }
        if (text) text.textContent = "Local Storage";
        if (modalDot) modalDot.className = "db-status-dot local";
        if (banner) banner.className = "db-banner-local";
        if (title) title.textContent = "Local Storage Mode Active";
        if (desc) desc.textContent = "Records are stored in this browser only. Connect Firebase Firestore below to store records securely online so multiple users and devices can access them.";
        if (syncBtn) syncBtn.style.display = "none";
        if (disconnBtn) disconnBtn.style.display = "none";
    }
}

function openDbConfigModal() {
    const modal = document.getElementById("dbConfigModal");
    if (!modal) return;
    modal.style.display = "flex";

    if (window.CloudDB) {
        const cfg = window.CloudDB.getActiveConfig();
        if (cfg) {
            document.getElementById("cfgApiKey").value = cfg.apiKey || "";
            document.getElementById("cfgProjectId").value = cfg.projectId || "";
            document.getElementById("cfgAppId").value = cfg.appId || "";
        }
        updateCloudDBStatusUI(window.CloudDB.isConnected(), cfg ? cfg.projectId : "");
    }
}

function closeDbConfigModal() {
    const modal = document.getElementById("dbConfigModal");
    if (modal) modal.style.display = "none";
}

async function saveCloudConfigFromUI() {
    const apiKey = document.getElementById("cfgApiKey").value.trim();
    const projectId = document.getElementById("cfgProjectId").value.trim();
    const appId = document.getElementById("cfgAppId").value.trim();

    if (!apiKey || !projectId) {
        alert("Please enter at least the Firebase API Key and Project ID.");
        return;
    }

    const config = {
        apiKey,
        projectId,
        authDomain: `${projectId}.firebaseapp.com`,
        storageBucket: `${projectId}.appspot.com`,
        appId: appId || "web-client"
    };

    if (window.CloudDB) {
        const success = await window.CloudDB.saveConfig(config);
        if (success) {
            alert(`🎉 Connected to Cloud Firestore (${projectId})!\n\nYour system is now backed by Google Cloud.`);
            closeDbConfigModal();
            if (members.length > 0) {
                if (confirm(`You have ${members.length} members stored locally in your browser. Would you like to upload them to your new Cloud Database now?`)) {
                    await syncLocalDataToCloud();
                }
            }
        } else {
            alert("Could not connect to Firebase with those credentials. Please check your Project ID and API Key, and ensure Firestore is created in Test Mode.");
        }
    }
}

async function syncLocalDataToCloud() {
    if (!window.CloudDB || !window.CloudDB.isConnected()) {
        alert("Cloud Database is not connected yet.");
        return;
    }
    if (members.length === 0) {
        alert("No members in local storage to upload.");
        return;
    }

    const confirmSync = confirm(`Upload all ${members.length} local member records to Cloud Firestore?`);
    if (!confirmSync) return;

    const syncBtn = document.getElementById("syncToCloudBtn");
    const originalText = syncBtn ? syncBtn.innerHTML : "";
    if (syncBtn) {
        syncBtn.disabled = true;
        syncBtn.innerHTML = "Uploading to Cloud...";
    }

    const success = await window.CloudDB.batchUpload(members, (processed, total) => {
        if (syncBtn) syncBtn.innerHTML = `Uploading ${processed}/${total}...`;
    });

    if (syncBtn) {
        syncBtn.disabled = false;
        syncBtn.innerHTML = originalText;
    }

    if (success) {
        alert(`Success! Uploaded ${members.length} member records to Google Cloud Firestore.`);
    } else {
        alert("Upload encountered an issue. Check your Firestore Security Rules in Firebase Console to make sure read/write is enabled.");
    }
}

function disconnectCloudDB() {
    if (confirm("Disconnect from Cloud Database? The application will revert to using Local Storage.")) {
        if (window.CloudDB) {
            window.CloudDB.disconnect();
            document.getElementById("cfgApiKey").value = "";
            document.getElementById("cfgProjectId").value = "";
            document.getElementById("cfgAppId").value = "";
        }
        updateCloudDBStatusUI(false);
        closeDbConfigModal();
    }
}

// Role Toggle Simulator
function toggleRole() {
    if (currentRole === "Central Admin") {
        currentRole = "District Admin (Gauteng)";
    } else if (currentRole === "District Admin (Gauteng)") {
        currentRole = "Tournament Referee (Read-Only)";
    } else {
        currentRole = "Central Admin";
    }
    const badgeText = document.getElementById("roleBadgeText");
    if (badgeText) badgeText.textContent = currentRole + " Mode";
    renderTable();
}

// Main Top Navigation Tabs
function switchTab(tabId) {
    document.querySelectorAll(".nav-tab").forEach(tab => tab.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach(pane => pane.classList.remove("active"));

    const targetTabBtn = Array.from(document.querySelectorAll(".nav-tab")).find(btn => btn.getAttribute("onclick").includes(tabId));
    if (targetTabBtn) targetTabBtn.classList.add("active");
    
    const pane = document.getElementById(tabId);
    if (pane) pane.classList.add("active");
}

// Sub-Navigation for the 4 Card Types in Registry
function switchRegistryCardType(cardType) {
    currentRegistryCardType = cardType;

    document.querySelectorAll(".registry-sub-tab").forEach(btn => btn.classList.remove("active"));
    const activeSubBtn = document.getElementById(`subtab_${cardType}`);
    if (activeSubBtn) activeSubBtn.classList.add("active");

    const meta = CARD_TYPE_META[cardType] || CARD_TYPE_META["national_grading"];
    
    // Update subtitle and import button label
    const subTitle = document.getElementById("registrySubTitle");
    if (subTitle) subTitle.textContent = `Viewing ${meta.fullTitle} database records.`;
    
    const importLabel = document.getElementById("importTargetLabel");
    if (importLabel) importLabel.textContent = meta.label;

    renderTableHeader();
    renderTable();
}

function renderTableHeader() {
    const thead = document.getElementById("memberTableHead");
    if (!thead) return;

    if (currentRegistryCardType === "national_grading") {
        thead.innerHTML = `
            <tr>
                <th>Official Name & Token</th>
                <th>Membership ID / ID No.</th>
                <th>District / Province</th>
                <th>NUA Nr</th>
                <th>Grading (A to E)</th>
                <th>Validity Period</th>
                <th>Status</th>
                <th style="text-align: right;">Actions</th>
            </tr>
        `;
    } else if (currentRegistryCardType === "provincial_grading") {
        thead.innerHTML = `
            <tr>
                <th>Official Name & Token</th>
                <th>Membership ID / ID No.</th>
                <th>Province</th>
                <th>District</th>
                <th>Grading (A to E)</th>
                <th>Validity Period</th>
                <th>Status</th>
                <th style="text-align: right;">Actions</th>
            </tr>
        `;
    } else if (currentRegistryCardType === "technical_theory") {
        thead.innerHTML = `
            <tr>
                <th>Official Name & Token</th>
                <th>Membership ID / ID No.</th>
                <th>District</th>
                <th>Level 1 Score (Year)</th>
                <th>Level 2 Score (Year)</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th style="text-align: right;">Actions</th>
            </tr>
        `;
    } else {
        // national_theory
        thead.innerHTML = `
            <tr>
                <th>Official Name & Token</th>
                <th>Membership ID / ID No.</th>
                <th>District</th>
                <th>Level 1</th>
                <th>Level 2</th>
                <th>Level 3</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th style="text-align: right;">Actions</th>
            </tr>
        `;
    }
}

// Render Database Table for Active Card Type
function renderTable() {
    const tbody = document.getElementById("memberTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const search = document.getElementById("searchInput").value.toLowerCase().trim();
    const prov = document.getElementById("provinceFilter").value;
    const status = document.getElementById("statusFilter").value;

    const filtered = members.filter(m => {
        // Must match active card type tab
        const matchesCardType = m.cardType === currentRegistryCardType;

        const matchesSearch = `${m.firstName} ${m.surname}`.toLowerCase().includes(search) || 
                              (m.id && m.id.toLowerCase().includes(search)) || 
                              (m.idNumber && m.idNumber.toLowerCase().includes(search)) ||
                              (m.token && m.token.toLowerCase().includes(search)) ||
                              (m.district && m.district.toLowerCase().includes(search)) ||
                              (m.nuaNumber && m.nuaNumber.toLowerCase().includes(search));
        
        const matchesProv = !prov || m.province === prov;
        const matchesStatus = !status || m.status === status;
        
        if (currentRole.includes("District Admin") && m.province !== "Gauteng") {
            return false;
        }

        return matchesCardType && matchesSearch && matchesProv && matchesStatus;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding: 40px; color: #64748b;">
                    <div style="font-size: 1rem; font-weight: 700; color: #334155;">No ${CARD_TYPE_META[currentRegistryCardType].label} records found</div>
                    <div style="font-size: 0.82rem; color: #94a3b8; margin-top: 4px;">Click "Add New Member" or "Import into ${CARD_TYPE_META[currentRegistryCardType].label}" to add records.</div>
                </td>
            </tr>`;
        return;
    }

    filtered.forEach(m => {
        const tr = document.createElement("tr");

        if (currentRegistryCardType === "national_grading") {
            tr.innerHTML = `
                <td class="member-info">
                    <strong>${m.firstName} ${m.surname}</strong>
                    <span>Token: <code>${m.token}</code></span>
                </td>
                <td><code>${m.id}</code><br><small style="color:#64748b;">ID: ${m.idNumber}</small></td>
                <td><strong>${m.district}</strong><br><small style="color:#64748b;">${m.province}</small></td>
                <td><strong style="color:#854d0e;">${m.nuaNumber || '—'}</strong></td>
                <td><span class="badge" style="background:#fef08a; color:#854d0e; font-size:0.9rem; font-weight:900;">Grade ${m.gradeLetter || 'C'}</span></td>
                <td><code>${m.validityYears || m.expiryDate}</code></td>
                <td><span class="badge badge-${m.status.toLowerCase()}">${m.status}</span></td>
                <td style="text-align: right;">${renderActionButtons(m.id, m.token, m.status)}</td>
            `;
        } else if (currentRegistryCardType === "provincial_grading") {
            tr.innerHTML = `
                <td class="member-info">
                    <strong>${m.firstName} ${m.surname}</strong>
                    <span>Token: <code>${m.token}</code></span>
                </td>
                <td><code>${m.id}</code><br><small style="color:#64748b;">ID: ${m.idNumber}</small></td>
                <td><strong>${m.province}</strong></td>
                <td><strong>${m.district}</strong></td>
                <td><span class="badge" style="background:#fee2e2; color:#991b1b; font-size:0.9rem; font-weight:900;">Grade ${m.gradeLetter || 'D'}</span></td>
                <td><code>${m.validityYears || m.expiryDate}</code></td>
                <td><span class="badge badge-${m.status.toLowerCase()}">${m.status}</span></td>
                <td style="text-align: right;">${renderActionButtons(m.id, m.token, m.status)}</td>
            `;
        } else if (currentRegistryCardType === "technical_theory") {
            const fmtLvl = (score, yr) => (score && score !== "%")
                ? `<strong style="color:#0284c7; font-size:0.92rem;">${score}</strong> ${yr ? '<small style="color:#64748b;">(' + yr + ')</small>' : ''}`
                : `<span style="color:#94a3b8;">%</span>`;
            tr.innerHTML = `
                <td class="member-info">
                    <strong>${m.firstName} ${m.surname}</strong>
                    <span>Token: <code>${m.token}</code></span>
                </td>
                <td><code>${m.id}</code><br><small style="color:#64748b;">ID: ${m.idNumber}</small></td>
                <td><strong>${m.district}</strong><br><small style="color:#64748b;">${m.province}</small></td>
                <td>${fmtLvl(m.level1Score, m.level1Year)}</td>
                <td>${fmtLvl(m.level2Score, m.level2Year)}</td>
                <td>${m.expiryDate}</td>
                <td><span class="badge badge-${m.status.toLowerCase()}">${m.status}</span></td>
                <td style="text-align: right;">${renderActionButtons(m.id, m.token, m.status)}</td>
            `;
        } else {
            // national_theory
            const fmtLvl = (score, yr) => (score && score !== "%")
                ? `<strong style="color:#059669; font-size:0.92rem;">${score}</strong> ${yr ? '<small style="color:#64748b;">(' + yr + ')</small>' : ''}`
                : `<span style="color:#94a3b8;">%</span>`;
            tr.innerHTML = `
                <td class="member-info">
                    <strong>${m.firstName} ${m.surname}</strong>
                    <span>Token: <code>${m.token}</code></span>
                </td>
                <td><code>${m.id}</code><br><small style="color:#64748b;">ID: ${m.idNumber}</small></td>
                <td><strong>${m.district}</strong><br><small style="color:#64748b;">${m.province}</small></td>
                <td>${fmtLvl(m.level1Score, m.level1Year)}</td>
                <td>${fmtLvl(m.level2Score, m.level2Year)}</td>
                <td>${fmtLvl(m.level3Score, m.level3Year)}</td>
                <td>${m.expiryDate}</td>
                <td><span class="badge badge-${m.status.toLowerCase()}">${m.status}</span></td>
                <td style="text-align: right;">${renderActionButtons(m.id, m.token, m.status)}</td>
            `;
        }

        tbody.appendChild(tr);
    });
}

function renderActionButtons(id, token, status) {
    return `
        <div class="button-group" style="justify-content: flex-end; gap: 4px;">
            <button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;" onclick="quickVerify('${token}')">Verify</button>
            ${currentRole.includes("Referee") ? '' : `
                <button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;" onclick="editMember('${id}')">Edit</button>
                <button class="btn btn-danger" style="padding:4px 8px; font-size:0.75rem;" onclick="toggleSuspend('${id}')">${status === 'Active' ? 'Suspend' : 'Activate'}</button>
                <button class="btn btn-danger" style="padding:4px 7px; font-size:0.75rem; background:#dc2626; border-color:#dc2626;" onclick="deleteMember('${id}')" title="Permanently delete member record">&times;</button>
            `}
        </div>
    `;
}

// Modal Handlers & Dynamic Card Type Field Toggling
function onModalCardTypeChange(type) {
    const secGrading = document.getElementById("sectionGradingFields");
    const secTech = document.getElementById("sectionTechTheoryFields");
    const secNat = document.getElementById("sectionNatTheoryFields");

    if (secGrading) secGrading.style.display = "none";
    if (secTech) secTech.style.display = "none";
    if (secNat) secNat.style.display = "none";

    if (type === "national_grading" || type === "provincial_grading") {
        if (secGrading) secGrading.style.display = "grid";
    } else if (type === "technical_theory") {
        if (secTech) secTech.style.display = "grid";
    } else if (type === "national_theory") {
        if (secNat) secNat.style.display = "grid";
    }
}

function openAddMemberModal() {
    document.getElementById("modalTitle").textContent = "Add New Member Record";
    document.getElementById("memberForm").reset();
    document.getElementById("memberId").value = "";
    document.getElementById("formIssueDate").valueAsDate = new Date();
    
    const exp = new Date();
    exp.setFullYear(exp.getFullYear() + 3);
    document.getElementById("formExpiryDate").valueAsDate = exp;

    const currentYear = new Date().getFullYear();
    const validityInput = document.getElementById("formValidityYears");
    if (validityInput) validityInput.value = `${currentYear} - ${currentYear + 3}`;

    // Default to the current active registry tab
    document.getElementById("formCardType").value = currentRegistryCardType;
    onModalCardTypeChange(currentRegistryCardType);
    
    document.getElementById("memberModal").style.display = "flex";
}

function closeMemberModal() {
    document.getElementById("memberModal").style.display = "none";
}

function saveMember(event) {
    event.preventDefault();
    const id = document.getElementById("memberId").value;
    const cardType = document.getElementById("formCardType").value;
    const firstName = document.getElementById("formFirstName").value.trim();
    const surname = document.getElementById("formSurname").value.trim();
    const idNumber = document.getElementById("formIdNumber").value.trim();
    const province = document.getElementById("formProvince").value;
    const district = document.getElementById("formDistrict").value.trim();
    const issueDate = document.getElementById("formIssueDate").value;
    const expiryDate = document.getElementById("formExpiryDate").value;
    const status = document.getElementById("formStatus").value;

    const gradeLetter = document.getElementById("formGradeLetter") ? document.getElementById("formGradeLetter").value : "C";
    const validityYears = document.getElementById("formValidityYears") ? document.getElementById("formValidityYears").value.trim() : "";
    const nuaNumber = document.getElementById("formNuaNumber") ? document.getElementById("formNuaNumber").value.trim() : "";

    const level1Year = (cardType === "technical_theory" ? document.getElementById("formTechL1Year").value : document.getElementById("formNatL1Year").value) || "";
    const level1Score = (cardType === "technical_theory" ? document.getElementById("formTechL1Score").value : document.getElementById("formNatL1Score").value) || "%";
    
    const level2Year = (cardType === "technical_theory" ? document.getElementById("formTechL2Year").value : document.getElementById("formNatL2Year").value) || "";
    const level2Score = (cardType === "technical_theory" ? document.getElementById("formTechL2Score").value : document.getElementById("formNatL2Score").value) || "%";

    const level3Year = document.getElementById("formNatL3Year") ? document.getElementById("formNatL3Year").value : "";
    const level3Score = document.getElementById("formNatL3Score") ? document.getElementById("formNatL3Score").value : "%";

    if (id) {
        const idx = members.findIndex(m => m.id === id);
        if (idx !== -1) {
            members[idx] = { 
                ...members[idx], 
                cardType, firstName, surname, idNumber, province, district, issueDate, expiryDate, status,
                gradeLetter, validityYears, nuaNumber,
                level1Year, level1Score, level2Year, level2Score, level3Year, level3Score
            };
        }
    } else {
        const provCode = province.substring(0, 3).toUpperCase();
        const typeCode = cardType.substring(0, 3).toUpperCase();
        const year = new Date().getFullYear();
        const seq = String(members.length + 1).padStart(4, '0');
        const newId = `ZA-${provCode}-${typeCode}-${year}-${seq}`;
        const newToken = "TOK-" + Math.random().toString(36).substring(2, 8).toUpperCase();

        members.unshift({
            id: newId,
            cardType,
            firstName,
            surname,
            idNumber,
            province,
            district,
            gradeLetter,
            validityYears,
            nuaNumber,
            level1Year,
            level1Score,
            level2Year,
            level2Score,
            level3Year,
            level3Score,
            issueDate,
            expiryDate,
            status,
            token: newToken,
            lastAudit: `Created by ${currentRole} on ${new Date().toISOString().split('T')[0]}`
        });
    }

    saveToLocalStorage();

    // Sync saved record to Cloud Firestore if connected
    if (window.CloudDB && window.CloudDB.isConnected()) {
        const savedMember = members.find(m => m.id === (id || newId));
        if (savedMember) {
            window.CloudDB.saveMember(savedMember);
        }
    }

    closeMemberModal();

    // Auto switch to that card type tab so user immediately sees newly saved record
    switchRegistryCardType(cardType);
    renderBatchSelectionList();
}

function editMember(id) {
    const m = members.find(x => x.id === id);
    if (!m) return;
    
    document.getElementById("modalTitle").textContent = "Edit Member Record: " + m.id;
    document.getElementById("memberId").value = m.id;
    document.getElementById("formCardType").value = m.cardType || "national_grading";
    onModalCardTypeChange(m.cardType || "national_grading");

    document.getElementById("formFirstName").value = m.firstName;
    document.getElementById("formSurname").value = m.surname;
    document.getElementById("formIdNumber").value = m.idNumber;
    document.getElementById("formProvince").value = m.province;
    document.getElementById("formDistrict").value = m.district;
    
    if (document.getElementById("formGradeLetter")) document.getElementById("formGradeLetter").value = m.gradeLetter || "C";
    if (document.getElementById("formValidityYears")) document.getElementById("formValidityYears").value = m.validityYears || "";
    if (document.getElementById("formNuaNumber")) document.getElementById("formNuaNumber").value = m.nuaNumber || "";

    if (document.getElementById("formTechL1Year")) document.getElementById("formTechL1Year").value = m.level1Year || "";
    if (document.getElementById("formTechL1Score")) document.getElementById("formTechL1Score").value = m.level1Score || "";
    if (document.getElementById("formTechL2Year")) document.getElementById("formTechL2Year").value = m.level2Year || "";
    if (document.getElementById("formTechL2Score")) document.getElementById("formTechL2Score").value = m.level2Score || "";

    if (document.getElementById("formNatL1Year")) document.getElementById("formNatL1Year").value = m.level1Year || "";
    if (document.getElementById("formNatL1Score")) document.getElementById("formNatL1Score").value = m.level1Score || "";
    if (document.getElementById("formNatL2Year")) document.getElementById("formNatL2Year").value = m.level2Year || "";
    if (document.getElementById("formNatL2Score")) document.getElementById("formNatL2Score").value = m.level2Score || "";
    if (document.getElementById("formNatL3Year")) document.getElementById("formNatL3Year").value = m.level3Year || "";
    if (document.getElementById("formNatL3Score")) document.getElementById("formNatL3Score").value = m.level3Score || "";

    document.getElementById("formIssueDate").value = m.issueDate;
    document.getElementById("formExpiryDate").value = m.expiryDate;
    document.getElementById("formStatus").value = m.status;

    document.getElementById("memberModal").style.display = "flex";
}

function toggleSuspend(id) {
    const m = members.find(x => x.id === id);
    if (!m) return;

    if (m.status === "Active") {
        m.status = "Suspended";
        m.lastAudit = `Suspended by ${currentRole} on ${new Date().toISOString().split('T')[0]}`;
    } else {
        m.status = "Active";
        m.lastAudit = `Re-activated by ${currentRole} on ${new Date().toISOString().split('T')[0]}`;
    }

    saveToLocalStorage();
    if (window.CloudDB && window.CloudDB.isConnected()) {
        window.CloudDB.saveMember(m);
    }
    renderTable();
}

function deleteMember(id) {
    const m = members.find(x => x.id === id);
    if (!m) return;
    if (!confirm(`Are you sure you want to permanently delete member record for ${m.firstName} ${m.surname} (${m.id})?`)) {
        return;
    }

    members = members.filter(x => x.id !== id);
    selectedMemberIdsForBatch.delete(id);
    saveToLocalStorage();

    if (window.CloudDB && window.CloudDB.isConnected()) {
        window.CloudDB.deleteMember(id);
    }

    renderTable();
    renderBatchSelectionList();
    renderPrintCards();
}

function saveToLocalStorage() {
    localStorage.setItem("nsa_sports_members_db_v3", JSON.stringify(members));
}

// Card Studio Batch Selection
function updateSelectionCounter() {
    const counter = document.getElementById("selectionCounter");
    if (counter) {
        counter.textContent = `${selectedMemberIdsForBatch.size} selected`;
    }
}

function getFilteredBatchMembers() {
    const cardTypeFilter = document.getElementById("batchFilterCardType") ? document.getElementById("batchFilterCardType").value : "";
    const provFilter = document.getElementById("batchFilterProvince") ? document.getElementById("batchFilterProvince").value : "";

    return members.filter(m => {
        const matchesType = !cardTypeFilter || m.cardType === cardTypeFilter;
        const matchesProv = !provFilter || m.province === provFilter;
        return matchesType && matchesProv;
    });
}

function syncSelectAllBatchCheckbox() {
    const selectAllChk = document.getElementById("selectAllBatchCheckbox");
    if (!selectAllChk) return;
    const filtered = getFilteredBatchMembers();
    if (filtered.length === 0) {
        selectAllChk.checked = false;
        selectAllChk.indeterminate = false;
        return;
    }
    const selectedCount = filtered.filter(m => selectedMemberIdsForBatch.has(m.id)).length;
    selectAllChk.checked = selectedCount === filtered.length;
    selectAllChk.indeterminate = selectedCount > 0 && selectedCount < filtered.length;
}

function renderBatchSelectionList() {
    const container = document.getElementById("batchList");
    if (!container) return;
    container.innerHTML = "";

    const filtered = getFilteredBatchMembers();

    if (filtered.length === 0) {
        container.innerHTML = `<div style="padding:14px; font-size:0.8rem; color:#64748b; text-align:center;">No officials match current filters</div>`;
        updateSelectionCounter();
        syncSelectAllBatchCheckbox();
        return;
    }

    filtered.forEach(m => {
        const div = document.createElement("div");
        div.className = "batch-item";
        
        let typeShort = "NAT-G";
        if (m.cardType === "provincial_grading") typeShort = "PROV-G";
        else if (m.cardType === "technical_theory") typeShort = "TECH-T";
        else if (m.cardType === "national_theory") typeShort = "NAT-T";

        div.innerHTML = `
            <input type="checkbox" id="chk_${m.id}" ${selectedMemberIdsForBatch.has(m.id) ? 'checked' : ''} onchange="toggleBatchSelection('${m.id}', this.checked)">
            <label for="chk_${m.id}"><strong>${m.firstName} ${m.surname}</strong> [${typeShort}] - ${m.status}</label>
        `;
        container.appendChild(div);
    });

    updateSelectionCounter();
    syncSelectAllBatchCheckbox();
}

function toggleBatchSelection(id, checked) {
    if (checked) {
        selectedMemberIdsForBatch.add(id);
    } else {
        selectedMemberIdsForBatch.delete(id);
    }
    updateSelectionCounter();
    syncSelectAllBatchCheckbox();
    renderPrintCards();
}

function toggleSelectAllBatch(checked) {
    const filtered = getFilteredBatchMembers();
    if (checked) {
        filtered.forEach(m => selectedMemberIdsForBatch.add(m.id));
    } else {
        filtered.forEach(m => selectedMemberIdsForBatch.delete(m.id));
    }
    renderBatchSelectionList();
    renderPrintCards();
}

function clearAllBatchSelections() {
    selectedMemberIdsForBatch.clear();
    renderBatchSelectionList();
    renderPrintCards();
}

function selectAllForPrint(selectActive = true) {
    if (!selectActive) {
        clearAllBatchSelections();
        return;
    }
    toggleSelectAllBatch(true);
}

// ==========================================================================
// RENDER PHYSICAL TICKET CARDS: 4 DISTINCT OFFICIAL TEMPLATES
// With 35-40% reduced title/name fonts and lifted bottom-right logo
// ==========================================================================
function renderPrintCards() {
    const sheet = document.getElementById("printSheet");
    if (!sheet) return;
    sheet.innerHTML = "";

    const selectedMembers = members.filter(m => selectedMemberIdsForBatch.has(m.id));

    if (selectedMembers.length === 0) {
        sheet.innerHTML = `
            <div style="padding:48px; text-align:center; color:#64748b;">
                <div style="font-size: 1rem; font-weight: 700; color: #334155;">No members selected for card printing</div>
                <div style="font-size: 0.84rem; margin-top: 6px;">Select one or more members from the left batch list to generate printable ticket cards.</div>
            </div>`;
        return;
    }

    selectedMembers.forEach(m => {
        const pair = document.createElement("div");
        pair.className = "card-pair";
        
        let cardFrontHtml = "";

        // TYPE 1: National Grading Umpire's Ticket (Yellow Block - Grade A to E)
        if (m.cardType === "national_grading") {
            const valYears = m.validityYears || "VALID 2024 - 2027";
            const box2Title = m.nuaNumber ? "NUA Nr:" : "PROVINCE";
            const box2Value = m.nuaNumber || m.province;

            cardFrontHtml = `
                <div class="nsa-card">
                    <div class="nsa-card-watermark"></div>
                    <div class="nsa-card-content">
                        <div class="nsa-card-header">
                            <div class="nsa-main-title">National Umpires Association</div>
                            <div class="nsa-sub-title">UMPIRE'S TICKET</div>
                        </div>
                        <div class="nsa-card-body">
                            <div class="nsa-left-col">
                                <div class="nsa-member-fullname">${m.firstName} ${m.surname}</div>
                                <div class="nsa-member-id">${m.idNumber}</div>
                                
                                <div class="nsa-boxes-row">
                                    <div class="nsa-info-box">
                                        <div class="nsa-info-box-title">DISTRICT</div>
                                        <div class="nsa-info-box-value">${m.district}</div>
                                    </div>
                                    <div class="nsa-info-box">
                                        <div class="nsa-info-box-title">${box2Title}</div>
                                        <div class="nsa-info-box-value">${box2Value}</div>
                                    </div>
                                </div>

                                <div class="nsa-signatures-row">
                                    <div class="nsa-sig-item">
                                        <div class="nsa-sig-img-container">
                                            <img src="assets/nsa_president_sig.png" class="nsa-sig-img" alt="NSA President Signature">
                                        </div>
                                        <div class="nsa-sig-label">NSA President</div>
                                    </div>
                                    <div class="nsa-sig-item">
                                        <div class="nsa-sig-img-container">
                                            <img src="assets/nsa_director_sig.png" class="nsa-sig-img" alt="NSA Director of Umpires Signature">
                                        </div>
                                        <div class="nsa-sig-label">NSA Director of Umpires</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Yellow Badge Box (Grade A to E) -->
                            <div class="nsa-grade-box-styled nsa-badge-yellow">
                                <div class="nsa-grade-validity-strip"><span>${valYears}</span></div>
                                <div class="nsa-grade-main-area">
                                    <div class="nsa-grade-category-title">SA</div>
                                    <div class="nsa-grade-big-char" style="${(m.gradeLetter && m.gradeLetter.length > 1) ? 'font-size: 2.35rem; letter-spacing: -1px;' : ''}">${m.gradeLetter || 'C'}</div>
                                    <div style="font-size:0.58rem; font-weight:700; color:#854d0e;">NATIONAL</div>
                                </div>
                            </div>
                        </div>

                        <!-- Lifted Bottom Right Logo -->
                        <div class="nsa-card-footer">
                            <img src="assets/netball_sa_logo.png" class="nsa-bottom-logo" alt="Netball South Africa">
                        </div>
                    </div>
                </div>
            `;
        }

        // TYPE 2: Provincial Grading Umpire's Ticket (Red Block - Grade A to E)
        else if (m.cardType === "provincial_grading") {
            const valYears = m.validityYears || "VALID 2026 - 2029";

            cardFrontHtml = `
                <div class="nsa-card">
                    <div class="nsa-card-watermark"></div>
                    <div class="nsa-card-content">
                        <div class="nsa-card-header">
                            <div class="nsa-main-title">National Umpires Association</div>
                            <div class="nsa-sub-title">UMPIRE'S TICKET</div>
                        </div>
                        <div class="nsa-card-body">
                            <div class="nsa-left-col">
                                <div class="nsa-member-fullname">${m.firstName} ${m.surname}</div>
                                <div class="nsa-member-id">${m.idNumber}</div>
                                
                                <div class="nsa-boxes-row">
                                    <div class="nsa-info-box">
                                        <div class="nsa-info-box-title">PROVINCE</div>
                                        <div class="nsa-info-box-value">${m.province}</div>
                                    </div>
                                    <div class="nsa-info-box">
                                        <div class="nsa-info-box-title">DISTRICT</div>
                                        <div class="nsa-info-box-value">${m.district}</div>
                                    </div>
                                </div>

                                <div class="nsa-signatures-row">
                                    <div class="nsa-sig-item">
                                        <div class="nsa-sig-img-container">
                                            <img src="assets/nsa_president_sig.png" class="nsa-sig-img" alt="NSA President Signature">
                                        </div>
                                        <div class="nsa-sig-label">NSA President</div>
                                    </div>
                                    <div class="nsa-sig-item">
                                        <div class="nsa-sig-img-container">
                                            <img src="assets/nsa_director_sig.png" class="nsa-sig-img" alt="NSA Director of Umpires Signature">
                                        </div>
                                        <div class="nsa-sig-label">NSA Director of Umpires</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Red / Pink Badge Box (Grade A to E) -->
                            <div class="nsa-grade-box-styled nsa-badge-red">
                                <div class="nsa-grade-validity-strip"><span>${valYears}</span></div>
                                <div class="nsa-grade-main-area">
                                    <div class="nsa-grade-category-title">Provincial</div>
                                    <div class="nsa-grade-big-char" style="${(m.gradeLetter && m.gradeLetter.length > 1) ? 'font-size: 2.35rem; letter-spacing: -1px;' : ''}">${m.gradeLetter || 'D'}</div>
                                    <div style="font-size:0.58rem; font-weight:700; color:#991b1b;">PROVINCE</div>
                                </div>
                            </div>
                        </div>

                        <!-- Lifted Bottom Right Logo -->
                        <div class="nsa-card-footer">
                            <img src="assets/netball_sa_logo.png" class="nsa-bottom-logo" alt="Netball South Africa">
                        </div>
                    </div>
                </div>
            `;
        }

        // TYPE 3: Technical Official Theory Result Card (Blue Blocks - Level 1 & 2)
        else if (m.cardType === "technical_theory") {
            cardFrontHtml = `
                <div class="nsa-card">
                    <div class="nsa-card-watermark"></div>
                    <div class="nsa-card-content nsa-theory-layout">
                        <div class="nsa-theory-header-section">
                            <div class="nsa-main-title">Technical Official</div>
                            <div class="nsa-sub-title">THEORY RESULT CARD</div>
                        </div>
                        
                        <div class="nsa-theory-member-row">
                            <div class="nsa-theory-member-col">
                                <div class="nsa-member-fullname">${m.firstName} ${m.surname}</div>
                                <div class="nsa-member-id">${m.idNumber}</div>
                            </div>
                            <div class="theory-district-box">
                                <div class="nsa-info-box-title" style="text-decoration:underline;">DISTRICT</div>
                                <div class="nsa-info-box-value" style="margin-top:2px;">${m.district}</div>
                            </div>
                        </div>

                        <!-- 2 Blue Blocks Spanning Full Width -->
                        <div class="nsa-theory-grid-container">
                            <div class="theory-blocks-wrapper">
                                <div class="theory-block theory-block-blue">
                                    <div class="theory-block-title">LEVEL 1</div>
                                    <div class="theory-block-score">${m.level1Score || '%'}</div>
                                    <div class="theory-block-top">
                                        <span class="theory-block-year">${m.level1Year || ''}</span>
                                    </div>
                                </div>

                                <div class="theory-block theory-block-blue">
                                    <div class="theory-block-title">LEVEL 2</div>
                                    <div class="theory-block-score">${m.level2Score || '%'}</div>
                                    <div class="theory-block-top">
                                        <span class="theory-block-year">${m.level2Year || ''}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style="display:flex; justify-content:space-between; align-items:flex-end; padding: 0 6px 4px 6px;">
                            <div class="nsa-signatures-row" style="margin-top:0;">
                                <div class="nsa-sig-item">
                                    <div class="nsa-sig-img-container">
                                        <img src="assets/nsa_president_sig.png" class="nsa-sig-img" alt="NSA President Signature">
                                    </div>
                                    <div class="nsa-sig-label">NSA President</div>
                                </div>
                                <div class="nsa-sig-item">
                                    <div class="nsa-sig-img-container">
                                        <img src="assets/nsa_director_sig.png" class="nsa-sig-img" alt="NSA Director of Umpires Signature">
                                    </div>
                                    <div class="nsa-sig-label">NSA Director of Umpires</div>
                                </div>
                            </div>

                            <img src="assets/netball_sa_logo.png" class="nsa-bottom-logo" alt="Netball South Africa" style="margin-bottom:2px;">
                        </div>
                    </div>
                </div>
            `;
        }

        // TYPE 4: National Theory Result Card (Green Blocks - Level 1, 2 & 3)
        else {
            cardFrontHtml = `
                <div class="nsa-card">
                    <div class="nsa-card-watermark"></div>
                    <div class="nsa-card-content nsa-theory-layout">
                        <div class="nsa-theory-header-section">
                            <div class="nsa-main-title">National Umpires Association</div>
                            <div class="nsa-sub-title">THEORY RESULT CARD</div>
                        </div>
                        
                        <div class="nsa-theory-member-row">
                            <div class="nsa-theory-member-col">
                                <div class="nsa-member-fullname">${m.firstName} ${m.surname}</div>
                                <div class="nsa-member-id">${m.idNumber}</div>
                            </div>
                            <div class="theory-district-box">
                                <div class="nsa-info-box-title" style="text-decoration:underline;">DISTRICT</div>
                                <div class="nsa-info-box-value" style="margin-top:2px;">${m.district}</div>
                            </div>
                        </div>

                        <!-- 3 Green Blocks Spanning Full Width -->
                        <div class="nsa-theory-grid-container">
                            <div class="theory-blocks-wrapper">
                                <div class="theory-block theory-block-green">
                                    <div class="theory-block-title">LEVEL 1</div>
                                    <div class="theory-block-score">${m.level1Score || '%'}</div>
                                    <div class="theory-block-top">
                                        <span class="theory-block-year">${m.level1Year || ''}</span>
                                    </div>
                                </div>

                                <div class="theory-block theory-block-green">
                                    <div class="theory-block-title">LEVEL 2</div>
                                    <div class="theory-block-score">${m.level2Score || '%'}</div>
                                    <div class="theory-block-top">
                                        <span class="theory-block-year">${m.level2Year || ''}</span>
                                    </div>
                                </div>

                                <div class="theory-block theory-block-green">
                                    <div class="theory-block-title">LEVEL 3</div>
                                    <div class="theory-block-score">${m.level3Score || '%'}</div>
                                    <div class="theory-block-top">
                                        <span class="theory-block-year">${m.level3Year || ''}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style="display:flex; justify-content:space-between; align-items:flex-end; padding: 0 6px 4px 6px;">
                            <div class="nsa-signatures-row" style="margin-top:0;">
                                <div class="nsa-sig-item">
                                    <div class="nsa-sig-img-container">
                                        <img src="assets/nsa_president_sig.png" class="nsa-sig-img" alt="NSA President Signature">
                                    </div>
                                    <div class="nsa-sig-label">NSA President</div>
                                </div>
                                <div class="nsa-sig-item">
                                    <div class="nsa-sig-img-container">
                                        <img src="assets/nsa_director_sig.png" class="nsa-sig-img" alt="NSA Director of Umpires Signature">
                                    </div>
                                    <div class="nsa-sig-label">NSA Director of Umpires</div>
                                </div>
                            </div>

                            <img src="assets/netball_sa_logo.png" class="nsa-bottom-logo" alt="Netball South Africa" style="margin-bottom:2px;">
                        </div>
                    </div>
                </div>
            `;
        }

        // BACK OF TICKET CARD (Security QR & Verification Instructions)
        const cardBackHtml = `
            <div class="nsa-card nsa-card-back">
                <div class="nsa-card-watermark"></div>
                <div class="nsa-back-body">
                    <div class="qr-box" id="qr_${m.id}"></div>
                    <div class="nsa-back-instructions">
                        <h4>SCAN TO VERIFY LIVE RECORD</h4>
                        <p>This credential card remains property of Netball South Africa. Scan QR code to view live official status and examination records.</p>
                        <p style="margin-top:6px; font-size:0.75rem; color:#005A36; font-weight:800;">Token: <code>${m.token}</code></p>
                        <p style="font-size:0.62rem; color:#64748b; margin-top:2px;">ID: ${m.id}</p>
                    </div>
                </div>
                <div class="nsa-card-footer" style="padding: 0 8px 6px 8px; z-index:2; position:relative;">
                    <img src="assets/netball_sa_logo.png" class="nsa-bottom-logo" style="height:26px;" alt="Netball South Africa">
                </div>
            </div>
        `;

        pair.innerHTML = cardFrontHtml + cardBackHtml;
        sheet.appendChild(pair);

        // Dynamic QR code generation
        setTimeout(() => {
            const qrContainer = document.getElementById(`qr_${m.id}`);
            if (qrContainer) {
                qrContainer.innerHTML = "";
                new QRCode(qrContainer, {
                    text: `https://verify.netballsa.org.za/v?token=${m.token}&id=${m.id}`,
                    width: 96,
                    height: 96,
                    colorDark: "#005A36",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
            }
        }, 50);
    });
}

// Side-by-Side A4 Portrait Export (Zero Right-Side Cutoff)
function exportSelectedCardsPDF() {
    const element = document.getElementById("printSheet");
    if (!element) return;

    element.classList.add("pdf-exporting");

    const opt = {
        margin:       [6, 2, 6, 2],
        filename:     `netball_sa_cards_${new Date().toISOString().split('T')[0]}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        element.classList.remove("pdf-exporting");
    }).catch(err => {
        element.classList.remove("pdf-exporting");
    });
}

// ==========================================================================
// LIVE VERIFICATION PORTAL
// ==========================================================================
function quickVerify(token) {
    switchTab('verifierTab');
    const input = document.getElementById("verifyTokenInput");
    if (input) input.value = token;
    verifyToken(token);
}

function verifyToken(token) {
    if (!token || !token.trim()) return;

    const m = members.find(x => x.token.toUpperCase() === token.trim().toUpperCase() || (x.id && x.id.toUpperCase() === token.trim().toUpperCase()));
    const display = document.getElementById("verificationResult");
    if (!display) return;
    display.style.display = "block";

    if (!m) {
        display.innerHTML = `
            <div class="verifier-status-banner status-REVOKED">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                INVALID OR UNRECOGNIZED TOKEN
            </div>
            <div style="padding:24px;">
                <p style="color:#ef4444; font-weight:700; font-size:1rem;">Warning: No matching official record found for token "${token}".</p>
                <p style="font-size:0.86rem; color:#64748b; margin-top:8px;">This physical credential card may be unverified or counterfeit. Please report the token to tournament organizers.</p>
            </div>
        `;
        return;
    }

    const isOk = m.status === "Active";
    const meta = CARD_TYPE_META[m.cardType] || CARD_TYPE_META["national_grading"];

    let credentialDetailHtml = "";
    if (m.cardType === "national_grading" || m.cardType === "provincial_grading") {
        credentialDetailHtml = `
            <div class="info-item">
                <label>Official Grading</label>
                <p style="font-size:1.15rem; color:#005A36;">Grade ${m.gradeLetter || 'C'}</p>
            </div>
            <div class="info-item">
                <label>Validity Period</label>
                <p>${m.validityYears || m.expiryDate}</p>
            </div>
        `;
    } else if (m.cardType === "technical_theory") {
        credentialDetailHtml = `
            <div class="info-item">
                <label>Level 1 Theory Score</label>
                <p>${m.level1Score || '%'} ${m.level1Year ? '('+m.level1Year+')' : ''}</p>
            </div>
            <div class="info-item">
                <label>Level 2 Theory Score</label>
                <p>${m.level2Score || '%'}</p>
            </div>
        `;
    } else if (m.cardType === "national_theory") {
        credentialDetailHtml = `
            <div class="info-item" style="grid-column: span 2;">
                <label>National Theory Exam Levels</label>
                <p>Level 1: <strong>${m.level1Score || '%'}</strong> ${m.level1Year ? '('+m.level1Year+')' : ''} | Level 2: <strong>${m.level2Score || '%'}</strong> | Level 3: <strong>${m.level3Score || '%'}</strong></p>
            </div>
        `;
    }

    display.innerHTML = `
        <div class="verifier-status-banner status-${m.status.toUpperCase()}">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                ${isOk ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>' : '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'}
            </svg>
            OFFICIAL STATUS: ${m.status.toUpperCase()}
        </div>
        <div class="verifier-body" style="padding:24px;">
            <div class="verifier-info-grid">
                <div class="info-item">
                    <label>Official Full Name</label>
                    <p>${m.firstName} ${m.surname}</p>
                </div>
                <div class="info-item">
                    <label>Card Category</label>
                    <p style="color:#005A36; font-weight:800;">${meta.fullTitle}</p>
                </div>
                <div class="info-item">
                    <label>ID / Passport Number</label>
                    <p><code>${m.idNumber}</code></p>
                </div>
                <div class="info-item">
                    <label>Province & District</label>
                    <p>${m.province} (${m.district})</p>
                </div>
                ${credentialDetailHtml}
                <div class="info-item">
                    <label>Verification Token</label>
                    <p><code>${m.token}</code></p>
                </div>
                <div class="info-item" style="grid-column: span 2;">
                    <label>Audit History & Log</label>
                    <p style="font-size:0.85rem; color:#64748b;">${m.lastAudit || 'Verified Record'}</p>
                </div>
            </div>
        </div>
    `;
}

// ==========================================================================
// CONTEXTUAL DATA EXPORT & IMPORT (Targeting Active Card Type Sub-Tab)
// ==========================================================================
function triggerCardTypeImport() {
    const fileInput = document.getElementById("importFile");
    if (fileInput) {
        fileInput.value = ""; // Reset file selection
        fileInput.click();
    }
}

function exportCSV() {
    const meta = CARD_TYPE_META[currentRegistryCardType];
    const categoryMembers = members.filter(m => m.cardType === currentRegistryCardType);

    let csv = "";
    if (currentRegistryCardType === "national_grading" || currentRegistryCardType === "provincial_grading") {
        csv = "ID,FirstName,Surname,IDNumber,Province,District,NUANumber,GradeLetter,ValidityYears,IssueDate,ExpiryDate,Status,Token\n";
        categoryMembers.forEach(m => {
            csv += `"${m.id}","${m.firstName}","${m.surname}","${m.idNumber}","${m.province}","${m.district}","${m.nuaNumber || ''}","${m.gradeLetter || 'C'}","${m.validityYears || ''}","${m.issueDate}","${m.expiryDate}","${m.status}","${m.token}"\n`;
        });
    } else if (currentRegistryCardType === "technical_theory") {
        csv = "ID,FirstName,Surname,IDNumber,Province,District,Level1Year,Level1Score,Level2Year,Level2Score,IssueDate,ExpiryDate,Status,Token\n";
        categoryMembers.forEach(m => {
            csv += `"${m.id}","${m.firstName}","${m.surname}","${m.idNumber}","${m.province}","${m.district}","${m.level1Year || ''}","${m.level1Score || '%'}","${m.level2Year || ''}","${m.level2Score || '%'}","${m.issueDate}","${m.expiryDate}","${m.status}","${m.token}"\n`;
        });
    } else {
        // national_theory
        csv = "ID,FirstName,Surname,IDNumber,Province,District,Level1Year,Level1Score,Level2Year,Level2Score,Level3Year,Level3Score,IssueDate,ExpiryDate,Status,Token\n";
        categoryMembers.forEach(m => {
            csv += `"${m.id}","${m.firstName}","${m.surname}","${m.idNumber}","${m.province}","${m.district}","${m.level1Year || ''}","${m.level1Score || '%'}","${m.level2Year || ''}","${m.level2Score || '%'}","${m.level3Year || ''}","${m.level3Score || '%'}","${m.issueDate}","${m.expiryDate}","${m.status}","${m.token}"\n`;
        });
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `netball_sa_${currentRegistryCardType}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const targetType = currentRegistryCardType;
    const targetMeta = CARD_TYPE_META[targetType];
    let imported = [];

    // Helper to extract fields using case-insensitive & space-insensitive header aliases
    function extractField(row, aliases) {
        const keys = Object.keys(row);
        for (const alias of aliases) {
            const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, "");
            for (const k of keys) {
                const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, "");
                if (cleanKey === cleanAlias) {
                    const v = row[k];
                    if (v !== undefined && v !== null && String(v).trim() !== "") {
                        return String(v).trim();
                    }
                }
            }
        }
        return "";
    }

    // Helper for province inference from district when Province column is omitted
    function inferProvince(prov, dist) {
        if (prov && prov.trim()) return prov.trim();
        const d = (dist || "").toLowerCase();
        if (d.includes("kenneth kaunda") || d.includes("bojanala") || d.includes("modiri molema") || d.includes("mompati")) return "North West";
        if (d.includes("buffalo city") || d.includes("nelson mandela") || d.includes("amathole") || d.includes("chris hani") || d.includes("or tambo") || d.includes("joe gqabi") || d.includes("sarah baartman") || d.includes("alfred nzo")) return "Eastern Cape";
        if (d.includes("tshwane") || d.includes("johannesburg") || d.includes("ekurhuleni") || d.includes("sedibeng") || d.includes("west rand") || d.includes("jhb")) return "Gauteng";
        if (d.includes("mangaung") || d.includes("fezile dabi") || d.includes("lejweleputswa") || d.includes("mofutsanyana") || d.includes("xhariep") || d.includes("mmed")) return "Free State";
        if (d.includes("ethekwini") || d.includes("umgungundlovu") || d.includes("cetshwayo") || d.includes("zululand") || d.includes("amajuba") || d.includes("ugu") || d.includes("ilembe") || d.includes("uthukela")) return "KwaZulu-Natal";
        if (d.includes("capricorn") || d.includes("mopani") || d.includes("sekhukhune") || d.includes("sekukhune") || d.includes("vhembe") || d.includes("waterberg")) return "Limpopo";
        if (d.includes("ehlanzeni") || d.includes("gert sibande") || d.includes("nkangala")) return "Mpumalanga";
        if (d.includes("frances baard") || d.includes("gaetsewe") || d.includes("namakwa") || d.includes("pixley") || d.includes("mgcawu")) return "Northern Cape";
        if (d.includes("cape town") || d.includes("winelands") || d.includes("garden route") || d.includes("eden") || d.includes("overberg") || d.includes("west coast") || d.includes("karoo") || d.includes("metro") || d.includes("bellville") || d.includes("meed")) return "Western Cape";
        return dist && dist.trim() ? dist.trim() : "National";
    }

    // Helper to tidy up names (trim extra spaces and capitalize leading lowercase letters like 'volgraaff' -> 'Volgraaff')
    function cleanName(nameStr) {
        if (!nameStr) return "";
        return String(nameStr)
            .trim()
            .replace(/\s+/g, " ")
            .replace(/(^|\s)([a-z])/g, (match, sep, char) => sep + char.toUpperCase());
    }

    // Helper for province abbreviation
    function getProvAbbr(prov) {
        const p = (prov || "").toLowerCase();
        if (p.includes("eastern cape")) return "EC";
        if (p.includes("free state")) return "FS";
        if (p.includes("gauteng")) return "GT";
        if (p.includes("kwazulu")) return "KZN";
        if (p.includes("limpopo")) return "LP";
        if (p.includes("mpumalanga")) return "MP";
        if (p.includes("north west")) return "NW";
        if (p.includes("northern cape")) return "NC";
        if (p.includes("western cape")) return "WC";
        return "ZA";
    }

    // Helper to format theory percentage scores
    function formatScore(score) {
        if (score === undefined || score === null) return "%";
        const s = String(score).trim();
        if (!s || s === "%") return "%";
        return s.endsWith("%") ? s : `${s}%`;
    }

    const reader = new FileReader();

    const processImportedList = (list) => {
        if (list.length === 0) {
            alert("No valid member records found in the uploaded file.\n\nPlease verify that your spreadsheet contains columns like Surname, Name, ID, District / Province.");
            return;
        }

        // Prepend imported members
        members = [...list, ...members];
        saveToLocalStorage();

        // Automatically select the newly imported records for Card Studio preview
        selectedMemberIdsForBatch.clear();
        list.forEach(m => selectedMemberIdsForBatch.add(m.id));
        const batchTypeSelect = document.getElementById("batchFilterCardType");
        if (batchTypeSelect) batchTypeSelect.value = targetType;
        const batchProvSelect = document.getElementById("batchFilterProvince");
        if (batchProvSelect) batchProvSelect.value = "";

        // Sync to Cloud Firestore if connected
        if (window.CloudDB && window.CloudDB.isConnected()) {
            window.CloudDB.batchUpload(list);
        }

        switchRegistryCardType(targetType);
        renderBatchSelectionList();
        renderPrintCards();

        alert(`🎉 Success! Imported ${list.length} official records directly into "${targetMeta.label}"!\n\nThey have also been pre-selected in Card Studio ready for printing.${window.CloudDB && window.CloudDB.isConnected() ? '\n☁️ Synced live to Cloud Firestore.' : ''}`);
    };

    try {
        if (file.name.toLowerCase().endsWith(".json")) {
            reader.onload = (e) => {
                try {
                    const parsed = JSON.parse(e.target.result);
                    const arr = Array.isArray(parsed) ? parsed : [parsed];
                    imported = arr.map((item, idx) => {
                        item.cardType = targetType;
                        if (!item.id) {
                            const pCode = getProvAbbr(item.province);
                            item.id = `ZA-${pCode}-${targetType === 'provincial_grading' ? 'PROV' : 'NAT'}-${new Date().getFullYear()}-${String(members.length + idx + 1).padStart(4, '0')}`;
                        }
                        if (!item.token) {
                            item.token = "TOK-" + Math.random().toString(36).substring(2, 8).toUpperCase();
                        }
                        return item;
                    });
                    processImportedList(imported);
                } catch(err) {
                    alert("Error parsing JSON file: " + err.message);
                } finally {
                    event.target.value = "";
                }
            };
            reader.readAsText(file);
        } else {
            // Excel (.xlsx, .xls) and CSV parsing via SheetJS (supports both flat headers & merged multi-column headers)
            reader.onload = (e) => {
                try {
                    if (typeof XLSX === "undefined") {
                        throw new Error("Excel parsing engine (SheetJS) is not loaded. Please refresh the page.");
                    }

                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: "array" });
                    const firstSheetName = workbook.SheetNames[0];
                    if (!firstSheetName) {
                        throw new Error("No worksheets found in this Excel file.");
                    }
                    const worksheet = workbook.Sheets[firstSheetName];

                    // Parse as 2D array to support merged header cells (e.g. LEVEL 1 (70%) spanning F1:H1) and duplicate year headers
                    const grid = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
                    if (!grid || grid.length < 2) {
                        processImportedList([]);
                        return;
                    }

                    // Locate header row (first row containing recognisable column headers)
                    let headerRowIdx = 0;
                    for (let rIdx = 0; rIdx < Math.min(10, grid.length); rIdx++) {
                        const rowJoined = grid[rIdx].map(c => String(c || "").toLowerCase()).join(" ");
                        if (rowJoined.includes("surname") || rowJoined.includes("name") || rowJoined.includes("district") || rowJoined.includes("grading") || rowJoined.includes("level")) {
                            headerRowIdx = rIdx;
                            break;
                        }
                    }

                    const headers = grid[headerRowIdx].map(h => String(h || "").trim());
                    const cleanHeaders = headers.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ""));

                    function findCol(aliases) {
                        for (const alias of aliases) {
                            const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, "");
                            const idx = cleanHeaders.indexOf(cleanAlias);
                            if (idx !== -1) return idx;
                        }
                        return -1;
                    }

                    function getCell(rowArr, colIdx) {
                        if (colIdx < 0 || colIdx >= rowArr.length) return "";
                        const val = rowArr[colIdx];
                        return val !== undefined && val !== null ? String(val).trim() : "";
                    }

                    // Locate standard columns
                    const colSurname = findCol(["surname", "last name", "lastname", "familieneem"]);
                    const colFirstName = findCol(["name", "first name", "firstname", "names", "voornaam"]);
                    const colIdNumber = findCol(["id number", "id no", "id_number", "idno", "id", "identity number", "sa id"]);
                    const colProvince = findCol(["province", "prov", "provinsie"]);
                    const colDistrict = findCol(["district", "distrik", "region"]);
                    const colGrading = findCol(["grading", "grade", "grade letter", "gradering", "umpire grade"]);
                    let colReceived = findCol(["received date", "received", "received_date", "valid from", "from date", "datum ontvang", "year", "exam year"]);
                    if (colReceived === -1) {
                        // Also detect a column whose header is itself a 4-digit year (e.g. '2026' in 'SURNAME,NAME,ID,DISTRICT,2026,Level 1,Level 2')
                        colReceived = headers.findIndex(h => /^\d{4}$/.test(h));
                    }
                    const colExpiry = findCol(["expiry date", "expiry", "expiry_date", "valid to", "to date", "vervaldatum"]);
                    const colValidity = findCol(["validity period", "validity years", "validity", "valid"]);
                    const colNua = findCol(["nua number", "nua nr", "nua no", "nua", "ticket nr"]);
                    const colStatus = findCol(["status"]);
                    const colCustomMemberId = findCol(["membership id", "member id", "official id"]);

                    // Locate Theory Level 1, 2, 3 columns (supports both '2026 | Level 1 | Level 2' and merged header blocks)
                    function locateLevelDescriptor(levelNum) {
                        let scoreStart = -1;
                        let scoreEnd = -1;
                        let yearCol = findCol([`level ${levelNum} year`, `level${levelNum} year`, `l${levelNum} year`, `level ${levelNum} date`]);

                        for (let c = 0; c < cleanHeaders.length; c++) {
                            const ch = cleanHeaders[c];
                            if ((ch.startsWith(`level${levelNum}`) || ch.startsWith(`l${levelNum}score`) || ch === `l${levelNum}` || ch.startsWith(`theory${levelNum}`)) && !ch.endsWith("year") && !ch.endsWith("date")) {
                                scoreStart = c;
                                scoreEnd = c;
                                // Expand across adjacent empty header cells (merged columns in Excel)
                                while (scoreEnd + 1 < headers.length && headers[scoreEnd + 1] === "") {
                                    scoreEnd++;
                                }
                                // Check if the column immediately to the left is the exam year column (e.g. header '2026' or 'YEAR')
                                if (yearCol === -1 && c > 0) {
                                    const leftRaw = headers[c - 1];
                                    const leftClean = cleanHeaders[c - 1];
                                    if (/^\d{4}$/.test(leftRaw) || leftClean.includes("year") || leftClean.includes("date")) {
                                        yearCol = c - 1;
                                    }
                                }
                                break;
                            }
                        }
                        return { scoreStart, scoreEnd, yearCol };
                    }

                    const lvl1Desc = locateLevelDescriptor(1);
                    const lvl2Desc = locateLevelDescriptor(2);
                    const lvl3Desc = locateLevelDescriptor(3);

                    function extractLevelData(rowArr, desc, sharedYear) {
                        let score = "";
                        if (desc.scoreStart !== -1) {
                            for (let c = desc.scoreStart; c <= desc.scoreEnd; c++) {
                                const val = getCell(rowArr, c);
                                if (val !== "" && val !== "%") {
                                    score = val;
                                    break;
                                }
                            }
                        }
                        // Only assign a year to this level if the candidate actually has a score for this level
                        let year = "";
                        if (score) {
                            if (desc.yearCol !== -1) {
                                year = getCell(rowArr, desc.yearCol);
                                if (!year && /^\d{4}$/.test(headers[desc.yearCol])) {
                                    year = headers[desc.yearCol];
                                }
                            }
                            if (!year && sharedYear) {
                                year = sharedYear;
                            }
                        }
                        return { year, score };
                    }

                    for (let rIdx = headerRowIdx + 1; rIdx < grid.length; rIdx++) {
                        const rowArr = grid[rIdx];
                        if (!rowArr || rowArr.length === 0) continue;

                        const surname = cleanName(getCell(rowArr, colSurname));
                        let firstName = cleanName(getCell(rowArr, colFirstName));
                        // Deduplicate trailing surname if accidentally repeated in the NAME column (e.g. 'Jessica Madonsela' + 'Madonsela')
                        if (surname && firstName.toLowerCase().endsWith(" " + surname.toLowerCase())) {
                            firstName = firstName.slice(0, firstName.length - surname.length - 1).trim();
                        }
                        let idNumber = getCell(rowArr, colIdNumber).replace(/^[^0-9A-Za-z]+|[^0-9A-Za-z]+$/g, "");
                        if (/^\d{11,12}$/.test(idNumber)) {
                            idNumber = idNumber.padStart(13, "0");
                        }
                        const rawProvince = getCell(rowArr, colProvince);
                        const district = getCell(rowArr, colDistrict);
                        const province = inferProvince(rawProvince, district);
                        const grading = getCell(rowArr, colGrading);
                        let receivedDate = getCell(rowArr, colReceived);
                        if (!receivedDate && colReceived !== -1 && /^\d{4}$/.test(headers[colReceived])) {
                            receivedDate = headers[colReceived];
                        }
                        const expiryDate = getCell(rowArr, colExpiry);
                        const validityYearsRaw = getCell(rowArr, colValidity);
                        const nuaNumber = getCell(rowArr, colNua);
                        const status = getCell(rowArr, colStatus) || "Active";

                        const l1 = extractLevelData(rowArr, lvl1Desc, receivedDate);
                        const l2 = extractLevelData(rowArr, lvl2Desc, receivedDate);
                        const l3 = extractLevelData(rowArr, lvl3Desc, receivedDate);

                        // Skip entirely empty rows
                        if (!surname && !firstName && !idNumber && !grading && !l1.score && !l2.score && !l3.score) continue;

                        // Determine primary exam/received year for issue & expiry dates (prefer highest completed level year)
                        const primaryYear = l3.year || l2.year || l1.year || receivedDate || String(new Date().getFullYear());

                        // Calculate Validity Period text (e.g. VALID 2026 - 2029)
                        let valStr = validityYearsRaw;
                        if (!valStr) {
                            if (receivedDate && expiryDate) {
                                valStr = `VALID ${receivedDate} - ${expiryDate}`;
                            } else if (expiryDate) {
                                valStr = `VALID UNTIL ${expiryDate}`;
                            } else if (/^\d{4}$/.test(primaryYear)) {
                                valStr = `VALID ${primaryYear} - ${Number(primaryYear) + 3}`;
                            } else {
                                valStr = "VALID 2026 - 2029";
                            }
                        } else if (!valStr.toUpperCase().startsWith("VALID") && valStr.includes("-")) {
                            valStr = `VALID ${valStr}`;
                        }

                        // Normalise issue date & expiry date
                        let issDate = "";
                        if (receivedDate) {
                            issDate = receivedDate.length === 4 ? `${receivedDate}-01-01` : receivedDate;
                        } else if (/^\d{4}$/.test(primaryYear)) {
                            issDate = `${primaryYear}-01-01`;
                        } else {
                            issDate = new Date().toISOString().split("T")[0];
                        }

                        let expDate = "";
                        if (expiryDate) {
                            expDate = expiryDate.length === 4 ? `${expiryDate}-12-31` : expiryDate;
                        } else if (/^\d{4}$/.test(primaryYear)) {
                            expDate = `${Number(primaryYear) + 3}-12-31`;
                        } else {
                            expDate = new Date(Date.now() + 3*365*24*60*60*1000).toISOString().split("T")[0];
                        }

                        // Generate unique Membership ID if not provided in sheet
                        const customId = getCell(rowArr, colCustomMemberId);
                        const provCode = getProvAbbr(province);
                        const typeCode = targetType === "provincial_grading" ? "PROV" : 
                                         targetType === "national_grading" ? "NAT" : 
                                         targetType === "technical_theory" ? "TECH" : "THEORY";
                        const generatedId = `ZA-${provCode}-${typeCode}-${primaryYear.substring(0, 4)}-${String(members.length + imported.length + 1).padStart(4, "0")}`;

                        const mObj = {
                            id: customId || generatedId,
                            cardType: targetType,
                            firstName: firstName || "Official",
                            surname: surname || "Member",
                            idNumber: idNumber || "",
                            province: province || "National",
                            district: district || "District",
                            gradeLetter: grading ? grading.toUpperCase().trim() : (targetType === "provincial_grading" ? "D" : "C"),
                            validityYears: valStr,
                            nuaNumber: nuaNumber || "",
                            level1Year: l1.year || "",
                            level1Score: formatScore(l1.score),
                            level2Year: l2.year || "",
                            level2Score: formatScore(l2.score),
                            level3Year: l3.year || "",
                            level3Score: formatScore(l3.score),
                            issueDate: issDate,
                            expiryDate: expDate,
                            status: status,
                            token: "TOK-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
                            lastAudit: `Imported into ${targetMeta.label} from Excel on ${new Date().toISOString().split('T')[0]}`
                        };

                        imported.push(mObj);
                    }

                    processImportedList(imported);
                } catch(err) {
                    alert("Error parsing file: " + err.message);
                } finally {
                    event.target.value = "";
                }
            };
            reader.readAsArrayBuffer(file);
        }
    } catch(err) {
        alert("Error reading file: " + err.message);
        event.target.value = "";
    }
}
