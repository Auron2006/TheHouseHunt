from PIL import Image
import os

# Directory paths (relative to the Python script)
input_dir = os.path.join(os.getcwd(), 'houses_raw')  # Input folder for raw images
output_dir = os.path.join(os.getcwd(), 'houses')     # Output folder for processed images

# Ensure the output directory exists
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

# Target resolution
target_size = (600, 600)

# Loop through all files in the input directory
for filename in os.listdir(input_dir):
    if filename.lower().endswith(('.png', '.jpeg', '.jpg', '.gif', '.bmp', '.webp')):
        # Open the image file
        img = Image.open(os.path.join(input_dir, filename))
        
        # Convert image to RGB if it's not already in RGB mode (necessary for JPG)
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize the image to 600x600 pixels
        img_resized = img.resize(target_size)
        
        # Create a new filename by converting the file extension to .jpg
        base_name, ext = os.path.splitext(filename)
        new_filename = f"{base_name}.jpg"
        
        # Save the resized image in the output directory
        img_resized.save(os.path.join(output_dir, new_filename), 'JPEG')
        
        print(f"Processed {filename} -> {new_filename}")

print(f"All images processed and saved to {output_dir}")