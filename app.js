// Sample Initial Database State matching Netball SA Official Ticket Schema
let members = [
    {
        id: "ZA-JHB-UMP-2025-0012",
        firstName: "Siyabonga",
        surname: "Dlamini",
        idNumber: "9204125088081",
        province: "Gauteng",
        district: "Johannesburg",
        qualification: "Umpiring",
        level: "Provincial",
        gradeCode: "GR",
        issueDate: "2025-02-10",
        expiryDate: "2027-02-10",
        status: "Active",
        token: "TOK-89F12A",
        lastAudit: "Approved by Central Admin on 2025-02-10"
    },
    {
        id: "ZA-CPT-COACH-2024-0044",
        firstName: "Anika",
        surname: "van der Merwe",
        idNumber: "8809154032087",
        province: "Western Cape",
        district: "Cape Town",
        qualification: "Coaching",
        level: "National",
        gradeCode: "NAT",
        issueDate: "2024-05-15",
        expiryDate: "2026-05-15",
        status: "Active",
        token: "TOK-33B91C",
        lastAudit: "Approved by District Admin (CPT) on 2024-05-15"
    },
    {
        id: "ZA-DUR-UMP-2023-0108",
        firstName: "Thabo",
        surname: "Mokoena",
        idNumber: "9511035077089",
        province: "KwaZulu-Natal",
        district: "eThekwini",
        qualification: "Umpiring",
        level: "Level 1",
        gradeCode: "L1",
        issueDate: "2023-01-20",
        expiryDate: "2025-01-20",
        status: "Expired",
        token: "TOK-77A40F",
        lastAudit: "Expired automatically on 2025-01-20"
    },
    {
        id: "ZA-PE-DUAL-2024-0019",
        firstName: "David",
        surname: "Smith",
        idNumber: "8507225011082",
        province: "Eastern Cape",
        district: "Nelson Mandela Bay",
        qualification: "Dual Official",
        level: "Level 2",
        gradeCode: "L2",
        issueDate: "2024-08-01",
        expiryDate: "2026-08-01",
        status: "Suspended",
        token: "TOK-11E88B",
        lastAudit: "Suspended by Disciplinary Board on 2026-04-12"
    }
];

let currentRole = "Central Admin"; // "Central Admin", "District Admin (Gauteng)", "Tournament Referee"
let selectedMemberIdsForBatch = new Set();
let badgeBgColor = "#ffb3ba";
let badgeBorderColor = "#d64550";

// App Initialization
document.addEventListener("DOMContentLoaded", () => {
    // Load local storage if available
    const savedData = localStorage.getItem("nsa_sports_members_db");
    if (savedData) {
        try { members = JSON.parse(savedData); } catch(e) {}
    }
    
    renderTable();
    renderBatchSelectionList();
    
    // Select first active member for default preview
    const activeMember = members.find(m => m.status === "Active");
    if (activeMember) {
        selectedMemberIdsForBatch.add(activeMember.id);
    }
    renderPrintCards();
});

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

// Tab Switching
function switchTab(tabId) {
    document.querySelectorAll(".nav-tab").forEach(tab => tab.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach(pane => pane.classList.remove("active"));

    const targetTabBtn = Array.from(document.querySelectorAll(".nav-tab")).find(btn => btn.getAttribute("onclick").includes(tabId));
    if (targetTabBtn) targetTabBtn.classList.add("active");
    
    const pane = document.getElementById(tabId);
    if (pane) pane.classList.add("active");
}

// Render Database Table
function renderTable() {
    const tbody = document.getElementById("memberTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const search = document.getElementById("searchInput").value.toLowerCase().trim();
    const prov = document.getElementById("provinceFilter").value;
    const qual = document.getElementById("qualFilter").value;
    const level = document.getElementById("levelFilter").value;
    const status = document.getElementById("statusFilter").value;

    const filtered = members.filter(m => {
        const matchesSearch = `${m.firstName} ${m.surname}`.toLowerCase().includes(search) || 
                              m.id.toLowerCase().includes(search) || 
                              m.idNumber.toLowerCase().includes(search) ||
                              m.token.toLowerCase().includes(search);
        const matchesProv = !prov || m.province === prov;
        const matchesQual = !qual || m.qualification === qual;
        const matchesLevel = !level || m.level === level;
        const matchesStatus = !status || m.status === status;
        
        // Role restriction simulation: District admin only sees their province
        if (currentRole.includes("District Admin") && m.province !== "Gauteng") {
            return false;
        }

        return matchesSearch && matchesProv && matchesQual && matchesLevel && matchesStatus;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding: 36px; color: #64748b;">
                    <div style="font-size: 0.95rem; font-weight: 600;">No matching official records found</div>
                    <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px;">Try clearing search filters or selecting a different province.</div>
                </td>
            </tr>`;
        return;
    }

    filtered.forEach(m => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="member-info">
                <strong>${m.firstName} ${m.surname}</strong>
                <span>Verification Token: <code>${m.token}</code></span>
            </td>
            <td>
                <code>${m.id}</code><br>
                <small style="color:#64748b;">ID: ${m.idNumber}</small>
            </td>
            <td><strong>${m.province}</strong><br><small style="color:#64748b;">${m.district}</small></td>
            <td><strong>${m.qualification}</strong><br><small style="color:#005A36; font-weight:700;">${m.level} (${m.gradeCode})</small></td>
            <td>${m.expiryDate}</td>
            <td><span class="badge badge-${m.status.toLowerCase()}">${m.status}</span></td>
            <td style="text-align: right;">
                <div class="button-group" style="justify-content: flex-end;">
                    <button class="btn btn-outline" style="padding:4px 10px; font-size:0.75rem;" onclick="quickVerify('${m.token}')">Verify</button>
                    ${currentRole.includes("Referee") ? '' : `
                        <button class="btn btn-outline" style="padding:4px 10px; font-size:0.75rem;" onclick="editMember('${m.id}')">Edit</button>
                        <button class="btn btn-danger" style="padding:4px 10px; font-size:0.75rem;" onclick="toggleSuspend('${m.id}')">${m.status === 'Active' ? 'Suspend' : 'Activate'}</button>
                    `}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Modal Handlers
function openAddMemberModal() {
    document.getElementById("modalTitle").textContent = "Add New Official Record";
    document.getElementById("memberForm").reset();
    document.getElementById("memberId").value = "";
    document.getElementById("formIssueDate").valueAsDate = new Date();
    
    // Default expiry 2 years
    const exp = new Date();
    exp.setFullYear(exp.getFullYear() + 2);
    document.getElementById("formExpiryDate").valueAsDate = exp;
    
    document.getElementById("memberModal").style.display = "flex";
}

function closeMemberModal() {
    document.getElementById("memberModal").style.display = "none";
}

function saveMember(event) {
    event.preventDefault();
    const id = document.getElementById("memberId").value;
    const firstName = document.getElementById("formFirstName").value.trim();
    const surname = document.getElementById("formSurname").value.trim();
    const idNumber = document.getElementById("formIdNumber").value.trim();
    const province = document.getElementById("formProvince").value;
    const district = document.getElementById("formDistrict").value.trim();
    const qualification = document.getElementById("formQualification").value;
    const level = document.getElementById("formLevel").value.trim();
    const gradeCode = document.getElementById("formGradeCode").value.trim();
    const issueDate = document.getElementById("formIssueDate").value;
    const expiryDate = document.getElementById("formExpiryDate").value;
    const status = document.getElementById("formStatus").value;

    if (id) {
        // Edit existing
        const idx = members.findIndex(m => m.id === id);
        if (idx !== -1) {
            members[idx] = { ...members[idx], firstName, surname, idNumber, province, district, qualification, level, gradeCode, issueDate, expiryDate, status };
        }
    } else {
        // Generate Standardized ID and Secure Token
        const provCode = province.substring(0, 3).toUpperCase();
        const qualCode = qualification.substring(0, 3).toUpperCase();
        const year = new Date().getFullYear();
        const seq = String(members.length + 1).padStart(4, '0');
        const newId = `ZA-${provCode}-${qualCode}-${year}-${seq}`;
        const newToken = "TOK-" + Math.random().toString(36).substring(2, 8).toUpperCase();

        members.unshift({
            id: newId,
            firstName,
            surname,
            idNumber,
            province,
            district,
            qualification,
            level,
            gradeCode,
            issueDate,
            expiryDate,
            status,
            token: newToken,
            lastAudit: `Created by ${currentRole} on ${new Date().toISOString().split('T')[0]}`
        });
    }

    saveToLocalStorage();
    closeMemberModal();
    renderTable();
    renderBatchSelectionList();
}

function editMember(id) {
    const m = members.find(x => x.id === id);
    if (!m) return;
    
    document.getElementById("modalTitle").textContent = "Edit Official Record: " + m.id;
    document.getElementById("memberId").value = m.id;
    document.getElementById("formFirstName").value = m.firstName;
    document.getElementById("formSurname").value = m.surname;
    document.getElementById("formIdNumber").value = m.idNumber;
    document.getElementById("formProvince").value = m.province;
    document.getElementById("formDistrict").value = m.district;
    document.getElementById("formQualification").value = m.qualification;
    document.getElementById("formLevel").value = m.level;
    document.getElementById("formGradeCode").value = m.gradeCode;
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
    renderTable();
}

function saveToLocalStorage() {
    localStorage.setItem("nsa_sports_members_db", JSON.stringify(members));
}

// Batch Selection & Card Studio
function setBadgeColor(bg, border) {
    badgeBgColor = bg;
    badgeBorderColor = border;
    document.querySelectorAll(".color-dot").forEach(dot => dot.classList.remove("active"));
    if (event && event.target) event.target.classList.add("active");
    renderPrintCards();
}

function updateSelectionCounter() {
    const counter = document.getElementById("selectionCounter");
    if (counter) {
        counter.textContent = `${selectedMemberIdsForBatch.size} selected`;
    }
}

function renderBatchSelectionList() {
    const container = document.getElementById("batchList");
    if (!container) return;
    container.innerHTML = "";
    const prov = document.getElementById("batchFilterProvince").value;

    const filtered = members.filter(m => !prov || m.province === prov);

    filtered.forEach(m => {
        const div = document.createElement("div");
        div.className = "batch-item";
        div.innerHTML = `
            <input type="checkbox" id="chk_${m.id}" ${selectedMemberIdsForBatch.has(m.id) ? 'checked' : ''} onchange="toggleBatchSelection('${m.id}', this.checked)">
            <label for="chk_${m.id}"><strong>${m.firstName} ${m.surname}</strong> (${m.gradeCode}) - ${m.status}</label>
        `;
        container.appendChild(div);
    });

    updateSelectionCounter();
}

function toggleBatchSelection(id, checked) {
    if (checked) {
        selectedMemberIdsForBatch.add(id);
    } else {
        selectedMemberIdsForBatch.delete(id);
    }
    updateSelectionCounter();
    renderPrintCards();
}

function selectAllForPrint(onlyActive = true) {
    selectedMemberIdsForBatch.clear();
    members.forEach(m => {
        if (!onlyActive || m.status === "Active") {
            selectedMemberIdsForBatch.add(m.id);
        }
    });
    renderBatchSelectionList();
    renderPrintCards();
}

// Render Physical Ticket Layout matching Netball SA Template Exactly with Exact Original Signatures
function renderPrintCards() {
    const sheet = document.getElementById("printSheet");
    if (!sheet) return;
    sheet.innerHTML = "";

    const selectedMembers = members.filter(m => selectedMemberIdsForBatch.has(m.id));

    if (selectedMembers.length === 0) {
        sheet.innerHTML = `
            <div style="padding:48px; text-align:center; color:#64748b;">
                <div style="font-size: 1rem; font-weight: 700; color: #334155;">No officials selected for card printing</div>
                <div style="font-size: 0.84rem; margin-top: 6px;">Select one or more officials from the left batch list to generate printable ticket cards.</div>
            </div>`;
        return;
    }

    selectedMembers.forEach(m => {
        const pair = document.createElement("div");
        pair.className = "card-pair";
        
        const subTitleHeader = m.qualification.toUpperCase().includes("COACH") ? "COACH'S TICKET" : "UMPIRE'S TICKET";

        pair.innerHTML = `
            <!-- FRONT OF TICKET CARD -->
            <div class="nsa-card" style="--badge-bg: ${badgeBgColor}; --badge-border: ${badgeBorderColor};">
                <div class="nsa-card-watermark"></div>
                <div class="nsa-card-content">
                    <div class="nsa-card-header">
                        <div class="nsa-main-title">National Umpires Association</div>
                        <div class="nsa-sub-title">${subTitleHeader}</div>
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

                            <!-- Exact Original Signatures -->
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

                        <!-- Right Grade Box -->
                        <div class="nsa-grade-box">
                            <div class="nsa-grade-title">${m.level}</div>
                            <div class="nsa-grade-code">«${m.gradeCode}</div>
                        </div>
                    </div>

                    <!-- Bottom Right Logo -->
                    <div class="nsa-card-footer">
                        <img src="assets/netball_sa_logo.png" class="nsa-bottom-logo" alt="Netball South Africa">
                    </div>
                </div>
            </div>

            <!-- BACK OF TICKET CARD -->
            <div class="nsa-card nsa-card-back">
                <div class="nsa-card-watermark"></div>
                <div class="nsa-back-body">
                    <div class="qr-box" id="qr_${m.id}"></div>
                    <div class="nsa-back-instructions">
                        <h4>SCAN TO VERIFY LIVE RECORD</h4>
                        <p>This ticket remains property of Netball South Africa. Scan QR code to view official live status, qualification, and province record.</p>
                        <p style="margin-top:6px; font-size:0.72rem; color:#005A36; font-weight:800;">Token: <code>${m.token}</code></p>
                        <p style="font-size:0.6rem; color:#64748b; margin-top:2px;">ID: ${m.id}</p>
                    </div>
                </div>
                <div class="nsa-card-footer" style="padding: 6px 14px; z-index:2; position:relative;">
                    <img src="assets/netball_sa_logo.png" class="nsa-bottom-logo" style="height:32px;" alt="Netball South Africa">
                </div>
            </div>
        `;

        sheet.appendChild(pair);

        // Generate QR code pointing to live verification portal
        setTimeout(() => {
            const qrContainer = document.getElementById(`qr_${m.id}`);
            if (qrContainer) {
                qrContainer.innerHTML = "";
                new QRCode(qrContainer, {
                    text: `https://verify.netballsa.org.za/v?token=${m.token}&id=${m.id}`,
                    width: 100,
                    height: 100,
                    colorDark: "#005A36",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
            }
        }, 50);
    });
}

function exportSelectedCardsPDF() {
    const element = document.getElementById("printSheet");
    if (!element) return;
    const opt = {
        margin:       8,
        filename:     `netball_sa_tickets_batch_${new Date().toISOString().split('T')[0]}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
}

// Live Verification
function quickVerify(token) {
    switchTab('verifierTab');
    const input = document.getElementById("verifyTokenInput");
    if (input) input.value = token;
    verifyToken(token);
}

function verifyToken(token) {
    if (!token || !token.trim()) return;

    const m = members.find(x => x.token.toUpperCase() === token.trim().toUpperCase() || x.id.toUpperCase() === token.trim().toUpperCase());
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
                <p style="font-size:0.86rem; color:#64748b; margin-top:8px;">This physical ticket card may be unverified or counterfeit. Please report the credential token to tournament officials.</p>
            </div>
        `;
        return;
    }

    const isOk = m.status === "Active";

    display.innerHTML = `
        <div class="verifier-status-banner status-${m.status.toUpperCase()}">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                ${isOk ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>' : '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'}
            </svg>
            OFFICIAL ACCREDITATION STATUS: ${m.status.toUpperCase()}
        </div>
        <div class="verifier-body" style="padding:24px;">
            <div class="verifier-info-grid">
                <div class="info-item">
                    <label>Official Full Name</label>
                    <p>${m.firstName} ${m.surname}</p>
                </div>
                <div class="info-item">
                    <label>ID / Passport Number</label>
                    <p><code>${m.idNumber}</code></p>
                </div>
                <div class="info-item">
                    <label>Qualification & Grade</label>
                    <p>${m.qualification} - ${m.level} (Grade: ${m.gradeCode})</p>
                </div>
                <div class="info-item">
                    <label>Province & District</label>
                    <p>${m.province} (${m.district})</p>
                </div>
                <div class="info-item">
                    <label>Expiry Date</label>
                    <p style="color: ${new Date(m.expiryDate) < new Date() ? '#dc2626' : '#0f172a'}">${m.expiryDate}</p>
                </div>
                <div class="info-item">
                    <label>Verification Token</label>
                    <p><code>${m.token}</code></p>
                </div>
                <div class="info-item" style="grid-column: span 2;">
                    <label>Audit History & Disciplinary Status</label>
                    <p style="font-size:0.85rem; color:#64748b;">${m.lastAudit}</p>
                </div>
            </div>
        </div>
    `;
}

// Data Export & Import
function exportCSV() {
    let csv = "ID,FirstName,Surname,IDNumber,Province,District,Qualification,Level,GradeCode,IssueDate,ExpiryDate,Status,Token\n";
    members.forEach(m => {
        csv += `"${m.id}","${m.firstName}","${m.surname}","${m.idNumber}","${m.province}","${m.district}","${m.qualification}","${m.level}","${m.gradeCode}","${m.issueDate}","${m.expiryDate}","${m.status}","${m.token}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `netball_sa_officials_database_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target.result;
            if (file.name.endsWith(".json")) {
                members = JSON.parse(content);
            } else {
                // Simple CSV parser
                const lines = content.split("\n").filter(l => l.trim().length > 0);
                const imported = [];
                for (let i = 1; i < lines.length; i++) {
                    const parts = lines[i].split(",").map(p => p.replace(/^"|"$/g, '').trim());
                    if (parts.length >= 9) {
                        imported.push({
                            id: parts[0],
                            firstName: parts[1],
                            surname: parts[2],
                            idNumber: parts[3],
                            province: parts[4],
                            district: parts[5],
                            qualification: parts[6],
                            level: parts[7],
                            gradeCode: parts[8] || "GR",
                            issueDate: parts[9] || "2025-01-01",
                            expiryDate: parts[10] || "2027-01-01",
                            status: parts[11] || "Active",
                            token: parts[12] || ("TOK-" + Math.random().toString(36).substring(2, 8).toUpperCase()),
                            lastAudit: "Imported from CSV file"
                        });
                    }
                }
                if (imported.length > 0) members = imported;
            }
            saveToLocalStorage();
            renderTable();
            renderBatchSelectionList();
            alert("Data imported successfully! " + members.length + " official records loaded.");
        } catch(err) {
            alert("Error parsing file: " + err.message);
        }
    };
    reader.readAsText(file);
}
