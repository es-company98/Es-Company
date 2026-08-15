 // Animation simple au défilement (Scroll Animations)
        const observerOptions = {
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        document.querySelectorAll('section').forEach(section => {
            observer.observe(section);
        });

        // Gestion multilingue de base intégrée dans le HTML pour test immédiat
        const translations = {
            fr: {
                logo: "ES-COMPANY / STOCKFLOW",
                badge_alert: "🛑 Arrêtez de subir la gestion papier",
                hero_title: "Les 3 erreurs invisibles qui vident la caisse de votre commerce chaque jour.",
                hero_subtitle: "Téléchargez le guide gratuit d'Es-Company et découvrez comment les commerçants malins sécurisent leur argent, éliminent les pertes et reprennent le contrôle total.",
                placeholder_name: "Votre Nom Complet",
                placeholder_contact: "Votre Email ou Numéro WhatsApp",
                cta_ebook: "Je reçois mon guide gratuit immédiatement (guide bilingue) ➔",
                section2_title: "Reconnaissez-vous cette situation dans votre boutique ?",
                pain1_title: "📉 Le flou total sur les chiffres",
                pain1_desc: "Vous utilisez des cahiers papier, les calculs sont faits à la volée, et à la fin du mois, vous ne connaissez pas votre vrai bénéfice.",
                pain2_title: "💸 Les pertes invisibles",
                pain2_desc: "Des produits qui disparaissent, des dettes mal contrôlées et de l'argent qui s'envole sans que vous sachiez exactement où.",
                pain3_title: "🧠 La fatigue mentale constante",
                pain3_desc: "Mémorisation excessive, efforts superflus, stress permanent... Vous travaillez plus, mais vous ne contrôlez rien.",
                transition_text: "\"Ce n’est pas de votre faute. Le papier a atteint ses limites. Pour grandir, vous avez besoin d’un système, pas d'efforts surhumains.\"",
                bridge_title: "Vous voulez aller plus loin et automatiser tout ça sans effort ?",
                bridge_desc: "Le guide gratuit va vous ouvrir les yeux sur les erreurs à éviter. Mais pour transformer votre commerce durablement, vous avez besoin de l'outil que nous avons créé pour notre propre boutique : StockFlow.",
                ben1_title: "⚡ Installation ultra-rapide",
                ben1_desc: "Pris en main le jour même, opérationnel en quelques minutes seulement sans compétences techniques.",
                ben2_title: "📊 Tableau de bord de l'argent",
                ben2_desc: "Suivez vos ventes, vos dépenses et vos dettes en 5 à 15 minutes par jour de gestion active.",
                ben3_title: "🛡️ Protection de votre capital",
                ben3_desc: "Fini les pertes de stock, le système travaille pour vous et sécurise vos gains, même à distance.",
                offer_title: "Passez d'une gestion approximative à un contrôle total.",
                offer_desc: "Obtenez StockFlow, son écosystème de formations vidéo pratiques et son accompagnement complet pour sécuriser votre entreprise.",
                offer_limit: "🔥 Offre de lancement exclusive réservée aux 20 premiers commerçants (Accès à vie).",
                whatsapp_cta: "Discuter avec l'expert et réserver ma licence ➔",
                trust_title: "Pourquoi faire confiance à Es-Company ?",
                trust_desc: "Nous ne vendons pas seulement des logiciels théoriques. StockFlow est né de nos propres galères de commerçants face aux limites du papier. Nous utilisons ce que nous enseignons, nous vous accompagnons personnellement à l'installation, et nous vous offrons des formations vidéo claires, conçues pour des entrepreneurs qui n'ont pas de temps à perdre. C'est le début d'un véritable écosystème pour faire grandir votre entreprise."
            },
            en: {
                logo: "ES-COMPANY / STOCKFLOW",
                badge_alert: "🛑 Stop suffering from paper management",
                hero_title: "The 3 invisible mistakes draining your store's cash register every day.",
                hero_subtitle: "Download Es-Company's free guide and discover how smart merchants secure their cash, eliminate losses, and regain total control.",
                placeholder_name: "Your Full Name",
                placeholder_contact: "Your Email or WhatsApp Number",
                cta_ebook: "Get my free guide immediately (bilingual guide) ➔",
                section2_title: "Do you recognize this situation in your store?",
                pain1_title: "📉 Total blur on numbers",
                pain1_desc: "You use paper notebooks, calculations are done on the fly, and at month-end, you don't know your true profit.",
                pain2_title: "💸 Invisible losses",
                pain2_desc: "Products disappearing, poorly controlled debts, and cash flying away without knowing exactly where.",
                pain3_title: "🧠 Constant mental fatigue",
                pain3_desc: "Excessive memorization, redundant efforts, permanent stress... You work harder, but control nothing.",
                transition_text: "\"It's not your fault. Paper has reached its limits. To grow, you need a system, not superhuman efforts.\"",
                bridge_title: "Want to go further and automate all this effortlessly?",
                bridge_desc: "The free guide will open your eyes to mistakes to avoid. But to transform your business permanently, you need the tool we built for our own store: StockFlow.",
                ben1_title: "⚡ Ultra-fast setup",
                ben1_desc: "Mastered on day one, operational in just a few minutes with zero technical skills.",
                ben2_title: "📊 Money Dashboard",
                ben2_desc: "Track sales, expenses, and debts in just 5 to 15 minutes of active management per day.",
                ben3_title: "🛡️ Capital Protection",
                ben3_desc: "No more stock losses, the system works for you and secures your earnings, even remotely.",
                offer_title: "Move from guesswork management to total control.",
                offer_desc: "Get StockFlow, its practical video training ecosystem, and complete setup support to secure your business.",
                offer_limit: "🔥 Exclusive launch offer reserved for the first 20 merchants (Lifetime access).",
                whatsapp_cta: "Chat with the expert and reserve my license ➔",
                trust_title: "Why trust Es-Company?",
                trust_desc: "We don't just sell theoretical software. StockFlow was born from our own struggles as merchants facing paper limits. We use what we teach, support you personally during setup, and offer clear video training designed for busy entrepreneurs. This is the start of a true ecosystem to grow your business."
            }
        };
// 1. Fonction modifiée pour sauvegarder et appliquer la langue
function setLanguage(lang) {
    // Enregistrer le choix dans le stockage local du navigateur
    localStorage.setItem('stockflow_lang', lang);

    // Mettre à jour l'état visuel des boutons de langue
    document.querySelectorAll('.lang-btn').forEach(btn => {
        if (btn.textContent.trim().toLowerCase() === lang.toLowerCase()) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    const t = translations[lang];
    if (!t) return;

    // Traduction des textes principaux
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.textContent = t[key];
    });

    // Traduction des placeholders des formulaires
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key]) el.placeholder = t[key];
    });
}

// 2. Charger automatiquement la langue enregistrée dès l'ouverture ou le rechargement de la page
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('stockflow_lang') || 'fr'; // 'fr' par défaut si rien n'est enregistré
    setLanguage(savedLang);
});
