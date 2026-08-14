// ==========================================
// FIREBASE CONFIG & ANALYTICS / LEADS ENGINE
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getFirestore, collection, addDoc, doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC7ydBosLM5qZOfef2y65PWCpEioPh-UNc",
    authDomain: "stockflow-leads.firebaseapp.com",
    projectId: "stockflow-leads",
    storageBucket: "stockflow-leads.firebasestorage.app",
    messagingSenderId: "227683189273",
    appId: "1:227683189273:web:9f57fa8871e77896152088",
    measurementId: "G-9K8BCSSBXD"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// URL de l'E-book gratuit (remplace par ton lien réel PDF ou stockage)
const EBOOK_DOWNLOAD_URL = "assets/ebook-3-erreurs.pdf"; 

document.addEventListener('DOMContentLoaded', () => {
    
    // ----------------------------------------------------
    // 1. GESTION DES VISITES & COMPTEUR GLOBAL (Analytics)
    // ----------------------------------------------------
    async function trackPageView() {
        try {
            const statsRef = doc(db, "stats", "page_metrics");
            const statsSnap = await getDoc(statsRef);

            if (statsSnap.exists()) {
                await updateDoc(statsRef, {
                    total_visits: increment(1)
                });
            } else {
                await setDoc(statsRef, {
                    total_visits: 1,
                    total_downloads: 0,
                    total_whatsapp_clicks: 0
                });
            }
        } catch (error) {
            console.error("Erreur lors du tracking de la visite :", error);
        }
    }
    trackPageView();

    // ----------------------------------------------------
    // 2. GESTION DU FORMULAIRE DE LEAD & TÉLÉCHARGEMENT EBOOK
    // ----------------------------------------------------
    const leadForm = document.getElementById('leadForm');
    
    // Vérifier si l'utilisateur s'est déjà inscrit dans cette session (LocalStorage)
    const storedUser = localStorage.getItem('stockflow_lead');
    if (storedUser && leadForm) {
        transformFormToDownloadState(JSON.parse(storedUser));
    }

    if (leadForm) {
        leadForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Récupération des valeurs au moment du clic
            const nom = document.getElementById('nom').value.trim();
            const contact = document.getElementById('contact').value.trim();
            const submitBtn = leadForm.querySelector('button[type="submit"]');

            if (!nom || !contact) return;

            // ==========================================
            // VALIDATION STRICTE (Anti-Spam / Anti-Faux)
            // ==========================================
            
            // 1. Validation du Nom (min 3 caractères, pas seulement des chiffres ou symboles)
            if (nom.length < 3 || /^[0-9!@#$%^&*(),.?":{}|<>-]+$/.test(nom)) {
                alert("Veuillez entrer un nom valide (au moins 3 caractères).");
                return;
            }

            // 2. Détection Email ou Téléphone & Validation
            const isEmail = contact.includes('@');

            if (isEmail) {
                const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                if (!emailRegex.test(contact)) {
                    alert("L'adresse email saisie n'est pas valide (ex: exemple@domaine.com).");
                    return;
                }
            } else {
                const cleanPhone = contact.replace(/[\s\-\+\(\)]/g, '');
                const isOnlyDigits = /^\d+$/.test(cleanPhone);
                const isRepeatedDigits = /^(\d)\1+$/.test(cleanPhone);

                if (!isOnlyDigits || cleanPhone.length < 8 || cleanPhone.length > 15 || isRepeatedDigits) {
                    alert("Veuillez entrer un numéro de téléphone valide (ex: +243XXXXXXXXX).");
                    return;
                }
            }
            // ==========================================

            submitBtn.disabled = true;
            submitBtn.textContent = "Génération de votre accès en cours...";

            try {
                // 1. Récupérer et incrémenter le compteur global de téléchargement
                const statsRef = doc(db, "stats", "page_metrics");
                const statsSnap = await getDoc(statsRef);
                let currentDownloadCount = 1;

                if (statsSnap.exists()) {
                    await updateDoc(statsRef, {
                        total_downloads: increment(1)
                    });
                    currentDownloadCount = (statsSnap.data().total_downloads || 0) + 1;
                } else {
                    await setDoc(statsRef, { total_visits: 1, total_downloads: 1, total_whatsapp_clicks: 0 }, { merge: true });
                }

                // 2. Enregistrement du lead dans la collection 'leads'
                const leadData = {
                    email: isEmail ? contact : "",
                    nom: nom,
                    telephone: !isEmail ? contact : "",
                    source: "ebook_3_erreurs",
                    status: "prospect",
                    counter: currentDownloadCount,
                    date_inscription: new Date().toISOString(),
                    interet_app: false,
                    createdAt: serverTimestamp()
                };

                const docRef = await addDoc(collection(db, "leads"), leadData);
                
                // Sauvegarde locale pour persistance de l'état
                localStorage.setItem('stockflow_lead', JSON.stringify({ id: docRef.id, nom, contact, counter: currentDownloadCount }));

                // 3. Déclenchement automatique du téléchargement de l'E-book
                triggerEbookDownload();

                // 4. Transformation propre de l'interface du formulaire
                transformFormToDownloadState({ nom, counter: currentDownloadCount });

            } catch (error) {
                console.error("Erreur lors de l'enregistrement Firebase :", error);
                submitBtn.disabled = false;
                submitBtn.textContent = "Je reçois mon guide gratuit immédiatement ➔";
                alert("Une erreur est survenue. Veuillez réessayer.");
            }
        });
    }

    // Fonction pour forcer le téléchargement direct
    function triggerEbookDownload() {
        const link = document.createElement('a');
        link.href = EBOOK_DOWNLOAD_URL;
        link.download = 'Guide-Gratuit-3-Erreurs-StockFlow.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Fonction pour transformer l'UI du formulaire en espace de téléchargement direct & pro
    function transformFormToDownloadState(data) {
        const formBox = document.querySelector('.lead-form-box');
        if (!formBox) return;

        formBox.innerHTML = `
            <div style="text-align: center; padding: 10px;">
                <div style="font-size: 3rem; margin-bottom: 10px;">🎉</div>
                <h3 style="font-size: 1.3rem; font-weight: 800; margin-bottom: 10px; color: #4cd137;">Félicitations ${data.nom} !</h3>
                <p style="color: rgba(255,255,255,0.85); font-size: 0.95rem; margin-bottom: 20px;">
                    Votre guide gratuit a démarré son téléchargement automatique (Vous êtes le <strong>n°${data.counter || 1}</strong> à l'obtenir).
                </p>
                <p style="color: rgba(255,255,255,0.6); font-size: 0.85rem; margin-bottom: 20px;">
                    Le téléchargement ne s'est pas lancé ? Cliquez sur le bouton de secours ci-dessous :
                </p>
                <button id="manualDownloadBtn" style="background: var(--brand-blue, #0047FF); color: #fff; border: none; padding: 12px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; width: 100%; box-shadow: 0 4px 12px rgba(0,71,255,0.3);">
                    📥 Télécharger l'E-book manuellement
                </button>
            </div>
        `;

        document.getElementById('manualDownloadBtn').addEventListener('click', () => {
            triggerEbookDownload();
        });
    }

    // ----------------------------------------------------
    // 3. TRACKING DES CLICS SUR LE BOUTON WHATSAPP DE L'OFFRE
    // ----------------------------------------------------
    const whatsappBtn = document.getElementById('whatsappBtn');
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', async (e) => {
            try {
                // Incrémenter le compteur global de clics WhatsApp dans la collection 'stats'
                const statsRef = doc(db, "stats", "page_metrics");
                await updateDoc(statsRef, {
                    total_whatsapp_clicks: increment(1)
                });

                // Si l'utilisateur s'est déjà inscrit, mettre à jour son document pour passer interet_app à true
                const localData = localStorage.getItem('stockflow_lead');
                if (localData) {
                    const parsed = JSON.parse(localData);
                    if (parsed.id) {
                        const leadDocRef = doc(db, "leads", parsed.id);
                        await updateDoc(leadDocRef, {
                            interet_app: true
                        });
                    }
                }
            } catch (error) {
                console.error("Erreur lors du tracking du clic WhatsApp :", error);
            }
        });
    }
});
