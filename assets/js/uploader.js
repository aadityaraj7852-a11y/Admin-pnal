import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

export async function initFirebaseStorage(){
  const app = initializeApp(window.CONFIG.firebase);
  return getStorage(app);
}

export function uploadFileWithProgress(storage, path, file, onProgress){
  return new Promise((resolve, reject)=>{
    const r = ref(storage, path);
    const task = uploadBytesResumable(r, file);

    task.on("state_changed",
      (snap)=>{
        if(onProgress) onProgress(snap);
      },
      (err)=>reject(err),
      async ()=>{
        const downloadURL = await getDownloadURL(task.snapshot.ref);
        resolve({ downloadURL });
      }
    );
  });
}
