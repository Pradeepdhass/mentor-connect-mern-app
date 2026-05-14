const toggle = document.getElementById('darkModeToggle');
  const body = document.body;

  toggle.addEventListener('change', function () {
    body.classList.toggle('dark-mode');
    localStorage.setItem('theme', this.checked ? 'dark' : 'light');
  });

  window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'dark') {
      body.classList.add('dark-mode');
      document.getElementById('darkModeToggle').checked = true;
    }
  });


  // Login with firebase
 // ✅ Replace with your Firebase config
  const firebaseConfig = {
   apiKey: "AIzaSyCD5EQTCv9sl7EUdk9fYpV3pl4T85o29vw",
  authDomain: "wt-signup-37fc1.firebaseapp.com",
  projectId: "wt-signup-37fc1",
  storageBucket: "wt-signup-37fc1.firebasestorage.app",
  messagingSenderId: "577032717056",
  appId: "1:577032717056:web:08d2bb632da361060229e5",
  measurementId: "G-GMWT5G9MRJ"
  };

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  // Mentee Signup
  document.getElementById('menteeRegisterForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('menteeEmail').value;
    const password = document.getElementById('menteePassword').value;

    auth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const userId = userCredential.user.uid;
        return db.collection('mentees').doc(userId).set({
          email: email,
          role: "mentee",
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      })
      .then(() => {
        document.getElementById('msg').textContent = "Mentee registered successfully!";
        document.getElementById('msg').style.color = "green";
        document.getElementById('menteeRegisterForm').reset();
      })
      .catch((error) => {
        document.getElementById('msg').textContent = error.message;
      });
  });

  // Mentor Signup
  document.getElementById('mentorRegisterForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('mentorEmail').value;
    const password = document.getElementById('mentorPassword').value;

    auth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const userId = userCredential.user.uid;
        return db.collection('mentors').doc(userId).set({
          email: email,
          role: "mentor",
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      })
      .then(() => {
        document.getElementById('msg').textContent = "Mentor registered successfully!";
        document.getElementById('msg').style.color = "green";
        document.getElementById('mentorRegisterForm').reset();
      })
      .catch((error) => {
        document.getElementById('msg').textContent = error.message;
      });
  });





  // Hide all sections
  function hideAllSections() {
    document.querySelectorAll('main > div').forEach(section => {
      section.style.display = 'none';
    });
  }

  // Show specific section
  function showSection(id) {
    hideAllSections();
    document.getElementById(id).style.display = 'block';

    if (id === 'calendarSection' && !window.calendarInitialized) {
      var calendarEl = document.getElementById('calendar');
      var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        height: 550,
        events: [
          {
            title: 'Mentoring Session',
            start: '2025-07-10',
            backgroundColor: '#0d6efd',
            borderColor: '#0d6efd',
          },
          {
            title: 'Assignment Review',
            start: '2025-07-15',
            backgroundColor: '#10b981',
            borderColor: '#10b981',
          }
        ]
      });
      calendar.render();
      window.calendarInitialized = true; // Prevent re-initialization
    }
  }

  // Show dashboard section by default on load
  window.onload = function () {
    showSection('dashboardSection');
  };
