arr = [9,3,1,2,6,5,3,8,7]

num_to_search = 9

for index in range(len(arr)):
    if(arr[index] == num_to_search):
        print(f"the num to seacrh i.e number { num_to_search } is found at index { index}")
        break;
    else:
     if(index == len(arr) - 1):   
            print(f"{num_to_search } is not present in array { arr }")
    