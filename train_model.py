import os
import sys
import pickle

# Add the functions folder to python path so we can import langham_model
sys.path.append(os.path.join(os.path.dirname(__file__), 'functions'))
from langham_model import DisplacementModel

def main():
    excel_path = os.path.join(os.path.dirname(__file__), 'langham_data.xlsx')
    pickle_path = os.path.join(os.path.dirname(__file__), 'functions', 'model.pkl')
    
    print("Initializing DisplacementModel...")
    model = DisplacementModel()
    
    print(f"Loading data from {excel_path} and training model...")
    print("This may take a moment because of the 17MB Excel file size...")
    
    # Train the models (lcr, adr, fnb)
    metrics = model.train(excel_path, verbose=True)
    
    print(f"Saving trained model to {pickle_path}...")
    with open(pickle_path, 'wb') as f:
        pickle.dump(model, f)
        
    print("Training and serialization completed successfully!")
    print(f"Model saved successfully at: {pickle_path}")
    print(f"Pickle file size: {os.path.getsize(pickle_path) / 1024:.2f} KB")

if __name__ == '__main__':
    main()
