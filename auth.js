import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js';
import { getFirestore, collection, getDoc, doc, updateDoc} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged  } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyC_sefxEBuN0jbzGj17ZWmcgI_4gAcrmfA",
    authDomain: "schedule-management-85d32.firebaseapp.com",
    projectId: "schedule-management-85d32",
    storageBucket: "schedule-management-85d32.appspot.com",
    messagingSenderId: "412719286176",
    appId: "1:412719286176:web:78ad83815794e871bf06c5"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const provider = new GoogleAuthProvider();

const firestore = getFirestore(app);
const usersCollection = collection(firestore, "/users");

export async function callAuth () {
  try {
    provider.setCustomParameters({
      prompt: 'select_account',
      hd: 'jstyle-yumekana.com',
    });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    const user = result.user;

    const userid = user.uid;
    const email = user.email;

    // Storing user data
    const userDocID = "gWagi4j6Q3ntPZVTPu89";
    const usersDocRef = doc(usersCollection, userDocID);

    const docSnapshot = await getDoc(usersDocRef);
    
    let resultToSend;

    if (docSnapshot.exists) {
      const data = docSnapshot.data();
      const userProfile = {
        email,
        name: user.displayName,
        auth_level: 'regular',
      };

      if (!data.userid) {
        await updateDoc(usersDocRef, {
          [userid]: userProfile,
        });
      }

        resultToSend = result;
        return true;
    } else {
      console.error("User document not found");
      throw new Error("User document not found");
    }
  } catch (error) {
    console.error("Error:", error);
    throw error;
  };
}

  
