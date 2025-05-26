// Firebase 配置
const firebaseConfig = {
    apiKey: "AIzaSyCW8Oqd3jzX39Aw2JaSqhpvTsGaCl_IqqI",
    authDomain: "chat-fbd2b.firebaseapp.com",
    databaseURL: "https://chat-fbd2b-default-rtdb.firebaseio.com",
    projectId: "chat-fbd2b",
    storageBucket: "chat-fbd2b.firebasestorage.app",
    messagingSenderId: "432603220805",
    appId: "1:432603220805:web:32403484d8849573e44c2c",
    measurementId: "G-E8DDSKNVE4"
};

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);

// 初始化 Realtime Database (用于留言树)
const realtimeDb = firebase.database();

// 初始化 Firestore (用于日历)
const firestoreDb = firebase.firestore();

// 导出数据库实例
window.realtimeDb = realtimeDb;
window.firestoreDb = firestoreDb; 