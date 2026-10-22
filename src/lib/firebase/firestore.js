// import function that generates fake restaurants and reviews
import { generateFakeRestaurantsAndReviews } from "@/src/lib/fakeRestaurants.js";

// import firestore functions for querying, reading, writing, and updating data
import {
  collection, // access collection of documents
  onSnapshot, // listen for real-time updates
  query, // build database queries
  getDocs, // retrieve multiple documents
  doc, // reference a document
  getDoc, // retrieve one document
  updateDoc, // update an existing document
  orderBy, // sort query results
  Timestamp, // represent firestore timestamps
  runTransaction, // run transaction for database updates
  where, // filter query results
  addDoc, // add document to collection
  getFirestore, // access firestore database
} from "firebase/firestore";

// import client-side firestore database instance
import { db } from "@/src/lib/firebase/clientApp";

// define asynchronous function that updates restaurant image reference
export async function updateRestaurantImageReference(
  restaurantId, // receive restaurant document id
  publicImageUrl // receive public image url
) {
  // create reference to restaurant document
  const restaurantRef = doc(collection(db, "restaurants"), restaurantId);

  // check if restaurant reference exists
  if (restaurantRef) {
    // update restaurant photo with public image url
    await updateDoc(restaurantRef, { photo: publicImageUrl });
  }
}

// define asynchronous helper that updates restaurant rating data
const updateWithRating = async (
  transaction, // pass the firestore transaction
  docRef, // pass the restaurant document reference
  newRatingDocument, // pass the new review document reference
  review // pass the review data
) => {
  // get the current restaurant document inside the transaction
  const restaurant = await transaction.get(docRef);
  // extract the data from the document
  const data = restaurant.data();
  // calculate the new number of ratings
  const newNumRatings = data?.numRatings ? data.numRatings + 1 : 1;
  // calculate the new sum of all ratings
  const newSumRating = (data?.sumRating || 0) + Number(review.rating);
  // calculate the new average rating
  const newAverage = newSumRating / newNumRatings;

  // update the restaurant document with the new rating stats
  transaction.update(docRef, {
    numRatings: newNumRatings, // set new number of ratings
    sumRating: newSumRating, // set new sum of ratings
    avgRating: newAverage, // set new average rating
  });

  // set the new review document in the subcollection
  transaction.set(newRatingDocument, {
    ...review, // spread the review text and rating
    timestamp: Timestamp.fromDate(new Date()), // add the current timestamp
  });
};

// define asynchronous function that adds review to restaurant
export async function addReviewToRestaurant(db, restaurantId, review) {
  // check if restaurant id is missing
  if (!restaurantId) {
    // throw error if no id
    throw new Error("No restaurant ID has been provided.");
  }

  // check if review data is missing
  if (!review) {
    // throw error if no review
    throw new Error("A valid review has not been provided.");
  }

  // start try block to catch errors
  try {
    // create reference to the restaurant document
    const docRef = doc(collection(db, "restaurants"), restaurantId);
    // create a new reference for the review document
    const newRatingDocument = doc(
      collection(db, `restaurants/${restaurantId}/ratings`),
    );

    // corrected line
    // run a transaction to update the restaurant and add the review safely
    await runTransaction(db, (transaction) =>
      updateWithRating(transaction, docRef, newRatingDocument, review),
    );
  } catch (error) {
    // log error if transaction fails
    console.error(
      "There was an error adding the rating to the restaurant",
      error,
    );
    // throw the error to the caller
    throw error;
  }
}

// define function that applies filters and sorting to query
function applyQueryFilters(q, { category, city, price, sort }) {
  // check if category filter exists
  if (category) {
    // filter restaurants by category
    q = query(q, where("category", "==", category));
  }

  // check if city filter exists
  if (city) {
    // filter restaurants by city
    q = query(q, where("city", "==", city));
  }

  // check if price filter exists
  if (price) {
    // filter restaurants by price level
    q = query(q, where("price", "==", price.length));
  }

  // sort by average rating when rating sort is selected or no sort is provided
  if (sort === "Rating" || !sort) {
    // order restaurants by average rating from highest to lowest
    q = query(q, orderBy("avgRating", "desc"));
  } else if (sort === "Review") {
    // order restaurants by review count from highest to lowest
    q = query(q, orderBy("numRatings", "desc"));
  }

  // return filtered and sorted query
  return q;
}

// define asynchronous function that retrieves restaurants with optional filters
export async function getRestaurants(db = db, filters = {}) {
  // create query for restaurants collection
  let q = query(collection(db, "restaurants"));

  // apply selected filters and sorting
  q = applyQueryFilters(q, filters);

  // retrieve matching restaurant documents
  const results = await getDocs(q);

  // convert documents into restaurant objects
  return results.docs.map((doc) => {
    // return document id, data, and converted timestamp
    return {
      id: doc.id, // include restaurant document id
      ...doc.data(), // include all restaurant fields
      // convert firestore timestamp to javascript date for client components
      timestamp: doc.data().timestamp.toDate(),
    };
  });
}

// define function that listens for real-time restaurant updates
export function getRestaurantsSnapshot(cb, filters = {}) {
  // check if callback is a function
  if (typeof cb !== "function") {
    // log error when callback is invalid
    console.log("Error: The callback parameter is not a function");
    // stop function when callback is invalid
    return;
  }

  // create query for restaurants collection
  let q = query(collection(db, "restaurants"));

  // apply selected filters and sorting
  q = applyQueryFilters(q, filters);

  // listen for changes to matching restaurant documents
  return onSnapshot(q, (querySnapshot) => {
    // convert updated documents into restaurant objects
    const results = querySnapshot.docs.map((doc) => {
      // return document id, data, and converted timestamp
      return {
        id: doc.id, // include restaurant document id
        ...doc.data(), // include all restaurant fields
        // convert firestore timestamp to javascript date for client components
        timestamp: doc.data().timestamp.toDate(),
      };
    });

    // pass updated restaurant list to callback
    cb(results);
  });
}

// define asynchronous function that retrieves restaurant by id
export async function getRestaurantById(db, restaurantId) {
  // check if restaurant id is missing
  if (!restaurantId) {
    // log error with invalid restaurant id
    console.log("Error: Invalid ID received: ", restaurantId);
    // stop function when id is missing
    return;
  }

  // create reference to restaurant document
  const docRef = doc(db, "restaurants", restaurantId);

  // retrieve restaurant document
  const docSnap = await getDoc(docRef);

  // return restaurant data with converted timestamp
  return {
    ...docSnap.data(), // include all restaurant fields
    timestamp: docSnap.data().timestamp.toDate(), // convert firestore timestamp to javascript date
  };
}

// define function that listens for real-time updates to one restaurant
export function getRestaurantSnapshotById(restaurantId, cb) {
  // check if restaurant id is missing
  if (!restaurantId) {
    // log error with invalid restaurant id
    console.log("Error: Invalid ID received: ", restaurantId);
    // stop function when id is missing
    return;
  }

  // check if callback is a function
  if (typeof cb !== "function") {
    // log error when callback is invalid
    console.log("Error: The callback parameter is not a function");
    // stop function when callback is invalid
    return;
  }

  // create reference to restaurant document
  const docRef = doc(db, "restaurants", restaurantId);

  // listen for changes to restaurant document
  return onSnapshot(docRef, (docSnap) => {
    // pass updated restaurant data and converted timestamp to callback
    cb({
      ...docSnap.data(), // include all restaurant fields
      timestamp: docSnap.data().timestamp.toDate(), // convert firestore timestamp to javascript date
    });
  });
}

// define asynchronous function that retrieves reviews for one restaurant
export async function getReviewsByRestaurantId(db, restaurantId) {
  // check if restaurant id is missing
  if (!restaurantId) {
    // log error with invalid restaurant id
    console.log("Error: Invalid restaurantId received: ", restaurantId);
    // stop function when id is missing
    return;
  }

  // create query for restaurant's ratings collection and sort by timestamp
  const q = query(
    collection(db, "restaurants", restaurantId, "ratings"), // access restaurant's ratings collection
    orderBy("timestamp", "desc") // sort newest reviews first
  );

  // retrieve matching review documents
  const results = await getDocs(q);

  // convert review documents into objects
  return results.docs.map((doc) => {
    // return review id, data, and converted timestamp
    return {
      id: doc.id, // include review document id
      ...doc.data(), // include all review fields
      // convert firestore timestamp to javascript date for client components
      timestamp: doc.data().timestamp.toDate(),
    };
  });
}

// define function that listens for real-time review updates
export function getReviewsSnapshotByRestaurantId(restaurantId, cb) {
  // check if restaurant id is missing
  if (!restaurantId) {
    // log error with invalid restaurant id
    console.log("Error: Invalid restaurantId received: ", restaurantId);
    // stop function when id is missing
    return;
  }

  // create query for restaurant's ratings collection and sort by timestamp
  const q = query(
    collection(db, "restaurants", restaurantId, "ratings"), // access restaurant's ratings collection
    orderBy("timestamp", "desc") // sort newest reviews first
  );

  // listen for changes to matching review documents
  return onSnapshot(q, (querySnapshot) => {
    // convert updated review documents into objects
    const results = querySnapshot.docs.map((doc) => {
      // return review id, data, and converted timestamp
      return {
        id: doc.id, // include review document id
        ...doc.data(), // include all review fields
        // convert firestore timestamp to javascript date for client components
        timestamp: doc.data().timestamp.toDate(),
      };
    });

    // pass updated review list to callback
    cb(results);
  });
}

// define asynchronous function that adds fake restaurants and reviews
export async function addFakeRestaurantsAndReviews() {
  // generate sample restaurant and review data
  const data = await generateFakeRestaurantsAndReviews();

  // loop through each restaurant and its reviews
  for (const { restaurantData, ratingsData } of data) {
    // attempt to add restaurant and review documents
    try {
      // add restaurant document to firestore
      const docRef = await addDoc(
        collection(db, "restaurants"), // select restaurants collection
        restaurantData // provide restaurant data
      );

      // loop through each review for current restaurant
      for (const ratingData of ratingsData) {
        // add review to restaurant's ratings subcollection
        await addDoc(
          collection(db, "restaurants", docRef.id, "ratings"), // select ratings subcollection using restaurant id
          ratingData // provide review data
        );
      }
    } catch (e) {
      // log message when adding documents fails
      console.log("There was an error adding the document");

      // log details of database error
      console.error("Error adding document: ", e);
    }
  }
}