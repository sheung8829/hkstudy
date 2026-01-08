import { db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const testFirebaseConnection = async () => {
  try {
    const testId = 'test_' + Date.now();
    const docRef = doc(db, 'test_collection', testId);
    
    await setDoc(docRef, {
      test: true,
      timestamp: Date.now()
    });
    
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      alert('Firebase 連線測試成功！寫入與讀取皆正常。');
    } else {
      alert('Firebase 寫入成功但讀取失敗？這很奇怪。');
    }
  } catch (error: any) {
    console.error('Firebase Test Error:', error);
    alert(`Firebase 測試失敗: ${error.message}\n代碼: ${error.code}`);
  }
};
