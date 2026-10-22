// import firebase storage functions for refs, uploading, and urls
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

// import the client-side firebase storage instance
import { storage } from "@/src/lib/firebase/clientApp";

// import the function to update the firestore database with the new url
import { updateRestaurantImageReference } from "@/src/lib/firebase/firestore";

// define the async function to handle the whole image update process
export async function updateRestaurantImage(restaurantId, image) {
  // start a try block to catch any upload errors
  try {
    // check if the restaurant id was provided
    if (!restaurantId) {
      // throw an error if the id is missing
      throw new Error("No restaurant ID has been provided.");
    }

    // check if a valid image file was provided
    if (!image || !image.name) {
      // throw an error if the image is missing
      throw new Error("A valid image has not been provided.");
    }

    // call the upload function to push the file to firebase storage
    const publicImageUrl = await uploadImage(restaurantId, image);
    // update the firestore document with the new public url
    await updateRestaurantImageReference(restaurantId, publicImageUrl);

    // return the new url so the ui can update
    return publicImageUrl;
  } catch (error) {
    // log any errors that happen during the process
    console.error("Error processing request:", error);
  }
}

// define the helper function that does the actual file upload
async function uploadImage(restaurantId, image) {
  // create the file path for storage using the id and file name
  const filePath = `images/${restaurantId}/${image.name}`;
  // create a storage reference pointing to that path
  const newImageRef = ref(storage, filePath);
  // upload the file to firebase storage
  await uploadBytesResumable(newImageRef, image);

  // fetch and return the public download url for the uploaded image
  return await getDownloadURL(newImageRef);
}