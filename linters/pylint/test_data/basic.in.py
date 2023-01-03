import string

shift = 3
choice = raw_input("would you like to encode or decode?")
word = raw_input("Please enter text")
letters = string.ascii_letters + string.punctuation + string.digits
encoded = ""
