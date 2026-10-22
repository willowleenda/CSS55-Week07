// import the new google genai sdk client
import { GoogleGenAI } from "@google/genai"; 
// import the function to get the authenticated firebase app
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp"; 
// import firestore database functions
import { getFirestore } from "firebase/firestore"; 
// import the function to fetch reviews for a restaurant
import { getReviewsByRestaurantId } from "@/src/lib/firebase/firestore.js"; 

// export the async server component for the summary
export async function GeminiSummary({ restaurantId }) { 
  // get the authenticated firebase server app instance
  const { firebaseServerApp } = await getAuthenticatedAppForUser(); 
  // fetch the reviews for this restaurant from firestore
  const reviews = await getReviewsByRestaurantId( 
    getFirestore(firebaseServerApp), // pass the firestore database instance
    restaurantId // pass the restaurant id to fetch reviews for
  ); 

  // define the character used to separate reviews in the prompt
  const reviewSeparator = "@"; 
  // construct the prompt to send to gemini
  const prompt = `
    Based on the following restaurant reviews, 
    where each review is separated by a '${reviewSeparator}' character, 
    create a one-sentence summary of what people think of the restaurant. 

    Here are the reviews: ${reviews.map((review) => review.text).join(reviewSeparator)}
  `; 

  // start a try block to handle potential errors
  try { 
    // check if the api key environment variable is missing
    if (!process.env.GEMINI_API_KEY) { 
      // throw an error if the key is not set
      throw new Error( 
        'GEMINI_API_KEY not set. Set it with "firebase apphosting:secrets:set GEMINI_API_KEY"'
      ); 
    } 

    // initialize the new genai sdk with the api key from environment variables
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); 

    // call the gemini model to generate the summary text
    const response = await ai.models.generateContent({ 
      model: 'gemini-2.0-flash', // specify the gemini model version
      contents: prompt, // pass the constructed prompt
    }); 

    // extract the text response from the generated content
    const text = response.text; 

    // return the jsx to render the summary
    return ( 
      <div className="restaurant__review_summary"> 
        <p>{text}</p> 
        <p>✨ Summarized with Gemini</p> 
      </div> 
    ); 
  } catch (e) { // catch any errors that occur in the try block
    // log the error to the server console
    console.error(e); 
    // return a fallback error message to the ui
    return <p>Error summarizing reviews.</p>; 
  } 
}

// export the loading skeleton component
export function GeminiSummarySkeleton() { 
  return ( 
    <div className="restaurant__review_summary"> 
      <p>✨ Summarizing reviews with Gemini...</p> 
    </div> 
  ); 
}