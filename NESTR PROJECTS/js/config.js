// App Configuration with Error Handling
console.log('Loading config.js...');

try {
    const CONFIG = {
        APP_NAME: 'StudentRent',
        VERSION: '1.0.0',
        API_BASE: 'https://your-backend-url.com/api',  // Change to full URL
        USE_MOCK_DATA: false  // Also disable mock data
    };

    // Nigerian States and Cities Data
    const NIGERIAN_LOCATIONS = {
        states: [
            "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
            "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo",
            "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
            "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers",
            "Sokoto", "Taraba", "Yobe", "Zamfara", "Federal Capital Territory"
        ],

        cities: {
            "Lagos": ["Lekki", "Victoria Island", "Ikeja", "Surulere", "Yaba", "Apapa", "Agege", "Maryland"],
            "Abuja": ["Wuse", "Garki", "Maitama", "Asokoro", "Gwarinpa", "Kubwa", "Lugbe"],
            "Rivers": ["Port Harcourt", "Obio-Akpor", "Eleme", "Oyigbo", "Rumuokoro"],
            "Edo": ["Benin City", "GRA", "Ugbowo", "Ekheuan", "Ugbor", "Siluko"],
            "Oyo": ["Ibadan", "Bodija", "UI Area", "Mokola", "Agodi", "Challenge"]
        }
    };

    // Make variables global
    window.CONFIG = CONFIG;
    window.NIGERIAN_LOCATIONS = NIGERIAN_LOCATIONS;

    console.log('Config loaded successfully');
} catch (error) {
    console.error('Error loading config:', error);
}