#include<iostream>
#include<vector>
#include<algorithm>
#include<math.h>
using namespace std;
int main()
{
    vector<int> vec={3,30,34,5,9};
    sort(vec.begin(),vec.end());
    int n=vec.size();
    int num=0;
    for(int i=n-1;i>=0;i--)
    {
        num+=vec[i]*pow(10,i);
    }
    cout<<"answer="<<num<<endl;
    string s=to_string(num);
    cout<<s;
    return 0;
}