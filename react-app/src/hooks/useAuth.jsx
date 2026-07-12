import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export function useAuth() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Try to fetch from admins, mentors, mentees, or users collections
          let docSnap = await getDoc(doc(db, 'admins', user.uid));
          if (docSnap.exists()) {
            setUserData({ ...docSnap.data(), uid: user.uid, role: 'admin' });
          } else {
            docSnap = await getDoc(doc(db, 'mentors', user.uid));
            if (docSnap.exists()) {
              setUserData({ ...docSnap.data(), uid: user.uid, role: 'mentor' });
            } else {
              docSnap = await getDoc(doc(db, 'mentees', user.uid));
              if (docSnap.exists()) {
                setUserData({ ...docSnap.data(), uid: user.uid, role: 'mentee' });
              } else {
                // Fallback to general users collection
                docSnap = await getDoc(doc(db, 'users', user.uid));
                if (docSnap.exists()) {
                  setUserData({ ...docSnap.data(), uid: user.uid });
                } else {
                  setUserData(null);
                }
              }
            }
          }
        } catch (e) {
          console.error(e);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    window.location.hash = '/login';
  };

  return { userData, loading, logout };
}
