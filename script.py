# list of names to check
names_to_check = [
  "Dr Anupam Sibal",
  "Dr Y K Amdekar",
  "Dr Vijay Yewale",
  "Dr Remesh Kumar R",
  "Dr Yaja Jebaying",
  "Dr Ramesh Srinivasan",
  "Dr Abhishek Kulkarni",
  "Dr V Sripathi",
  "Dr Sujit Chowdhury",
  "Dr Shekhar G Patil",
  "Dr Sudha Ekembaram",
  "Dr Ramya Uppuluri",
  "Dr Arvind Bagga",
  "Dr RN Srivastava",
  "Dr Prakritish Bora",
  "Dr Vidya Krishna",
  "Dr Muthukumaran C S",
  "Dr Meena Thiagarajan",
  "Dr S K Kabra",
  "Dr Sushil Kumar",
  "Dr Nameet Jerath",
  "Dr Abhijeet Bagde",
  "Dr Omprakash Jamadar",
  "Dr Avneet Kaur",
  "Dr Mehul Shah",
  "Dr Amita Mahajan",
  "Dr Bijan Saha",
  "Dr Brajagopal Ray",
  "Dr Jaydeep Chaudhury",
  "Dr Bhaswati C Acharya",
  "Dr Soumitra S Datta",
  "Dr Subhasis Roy",
  "Dr Jasodhara Chaudhuri",
  "Dr Subhasish Bhattacharyya",
  "Dr Saswati Mukhopadhyay"
]

# file containing names
file_path = "program.html"

with open(file_path, "r", encoding="utf-8") as f:
    file_content = f.read().lower()

missing = []

for name in names_to_check:
    if name.lower() not in file_content:
        missing.append(name)

print("Missing names:")
for m in missing:
    print(m)