import firebase_admin
from firebase_admin import credentials, firestore
import os

# Initialize Firebase Admin SDK with the service account key
cred = credentials.Certificate('serviceAccountKey.json')  # Use your service account JSON file path
firebase_admin.initialize_app(cred)

# Firestore setup
db = firestore.client()

# Directory where the house images are stored locally (in your project)
input_dir = os.path.join(os.getcwd(), 'houses')  # Folder with house images

# Firestore collection reference
collection_ref = db.collection('houses')

# Base URL for images hosted on Vercel (you'll need to modify this with the actual deployment URL)
base_url = "https://your-vercel-deployment-url.com/houses/"

# Loop through all files in the input directory
for filename in os.listdir(input_dir):
    if filename.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
        # Construct the URL where the image will be hosted on Vercel
        image_url = f"{base_url}{filename}"

        # Add a Firestore document with the image URL and metadata
        doc_ref = collection_ref.add({
            'url': image_url,   # Store the image URL for later use
            'name': filename,   # Store the filename as the house's name
            'rating': 1200,     # Default Elo rating
            'date_added': firestore.SERVER_TIMESTAMP,  # Timestamp for when it was added
            'number_of_matches': 0  # Initialize matches to 0
        })

        print(f"Added Firestore document for {filename} with URL: {image_url}")

print("All images have been added to Firestore.")