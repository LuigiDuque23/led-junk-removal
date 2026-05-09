document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Logic
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const closeMenuBtn = document.getElementById('close-menu-btn');

    if (mobileMenuBtn && mobileMenu && closeMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        });

        closeMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
            document.body.style.overflow = '';
        });
    }

    // Initialize Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }

    // Google Maps Handling
    initializeGoogleMaps();
});

async function initializeGoogleMaps() {
    try {
        const apiKey = 'AIzaSyChuL9W28t7z7IeDTRpygJwCMCeo69N4so';

        if (!apiKey || apiKey === 'YOUR_API_KEY') {
            console.warn('Google Maps API Key not configured');
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry,routes&callback=initAutocomplete`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    } catch (error) {
        console.error('Error loading Google Maps config:', error);
    }
}

let distanceValue = null;
const ORIGIN_COORDS = { lat: 34.9754, lng: -81.0825 };

window.initAutocomplete = function() {
    const input = document.getElementById('address-input');
    if (!input) return;

    const autocomplete = new google.maps.places.Autocomplete(input, {
        types: ['address'],
        componentRestrictions: { country: 'us' }
    });

    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry && place.geometry.location) {
            calculateDistance(place.geometry.location);
        }
    });

    // Handle form submission status
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const successMsg = document.getElementById('submit-success');
            const errorMsg = document.getElementById('submit-error');
            
            if (submitBtn) submitBtn.disabled = true;
            if (successMsg) successMsg.classList.add('hidden');
            if (errorMsg) errorMsg.classList.add('hidden');

            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData.entries());
            data.distance = distanceValue;

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    if (successMsg) successMsg.classList.remove('hidden');
                    contactForm.reset();
                    distanceValue = null;
                    const notice = document.getElementById('distance-notice');
                    if (notice) notice.classList.add('hidden');
                } else {
                    if (errorMsg) errorMsg.classList.remove('hidden');
                }
            } catch (error) {
                if (errorMsg) errorMsg.classList.remove('hidden');
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }
};

function calculateDistance(destination) {
    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix({
        origins: [new google.maps.LatLng(ORIGIN_COORDS.lat, ORIGIN_COORDS.lng)],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.IMPERIAL
    }, (response, status) => {
        if (status === 'OK' && response.rows[0].elements[0].distance) {
            distanceValue = response.rows[0].elements[0].distance.value / 1609.34;
            updateDistanceNotice();
        }
    });
}

function updateDistanceNotice() {
    const notice = document.getElementById('distance-notice');
    if (!notice) return;

    if (distanceValue > 50) {
        notice.classList.remove('hidden');
        notice.querySelector('.dist-miles').textContent = distanceValue.toFixed(1);
    } else {
        notice.classList.add('hidden');
    }
}
