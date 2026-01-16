import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Minimal resources for demonstration
const resources = {
    en: {
        translation: {
            "nav": {
                "dashboard": "Dashboard",
                "trips": "Browse Trips",
                "wishlist": "Wishlist",
                "bookings": "My Bookings",
                "chat": "AI Assistant",
                "profile": "Profile",
                "logout": "Logout",
                "login": "Get Started"
            },
            "footer": {
                "rights": "All rights reserved.",
                "reviews": "User Reviews"
            },
            "dashboard": {
                "welcome": "Welcome back",
                "total_savings": "Total Savings",
                "active_goals": "Active Goals",
                "create_goal": "Start Saving for Your First Goal",
                "explore": "Explore Destinations"
            }
        }
    },
    fr: {
        translation: {
            "nav": {
                "dashboard": "Tableau de bord",
                "trips": "Parcourir les voyages",
                "wishlist": "Liste de souhaits",
                "bookings": "Mes réservations",
                "chat": "Assistant IA",
                "profile": "Profil",
                "logout": "Déconnexion",
                "login": "Commencer"
            },
            "footer": {
                "rights": "Tous droits réservés.",
                "reviews": "Avis des utilisateurs"
            },
            "dashboard": {
                "welcome": "Bon retour",
                "total_savings": "Économies totales",
                "active_goals": "Objectifs actifs",
                "create_goal": "Commencez à économiser pour votre premier objectif",
                "explore": "Explorer les destinations"
            }
        }
    },
    es: {
        translation: {
            "nav": {
                "dashboard": "Panel",
                "trips": "Explorar viajes",
                "wishlist": "Lista de deseos",
                "bookings": "Mis reservas",
                "chat": "Asistente IA",
                "profile": "Perfil",
                "logout": "Cerrar sesión",
                "login": "Comenzar"
            }
        }
    },
    sw: {
        translation: {
            "nav": {
                "dashboard": "Dashibodi",
                "trips": "Angalia Safari",
                "wishlist": "Vipendwa",
                "bookings": "Uhifadhi Wangu",
                "chat": "Msaidizi wa AI",
                "profile": "Wasifu",
                "logout": "Ondoka",
                "login": "Anza"
            }
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['localStorage'],
            caches: ['localStorage'],
            lookupLocalStorage: 'tembea_language'
        }
    });

export default i18n;
