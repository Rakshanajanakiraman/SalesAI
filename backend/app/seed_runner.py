import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.core.database import SessionLocal
from app.services.sample_generator import seed_sample_dataset

def main():
    print("Beginning MarketMind AI Indian Sample Dataset Generation...")
    db = SessionLocal()
    try:
        res = seed_sample_dataset(db, force_reset=True)
        print("Dataset Seeding Completed Successfully!")
        print("Summary:", res)
    finally:
        db.close()

if __name__ == "__main__":
    main()
