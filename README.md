# IPv4Explorer : IPv4 block visualizer

IPv4 addresses are encoded in 32 bits, with a maximum of 4,294,967,296 possible addresses.

Is it possible to see who owns the addresses? This tool tries to answer that question. It's an interactive representation, similar to a Google Map. You can try the tool at this address: [ipv4.dev.sarl](http://ipv4.dev.sarl/)

![image](https://user-images.githubusercontent.com/10708817/220412250-5046068b-ee88-480c-86c1-fb7b10ea17e3.png)


At level 0, you can see the sharing of blocks based on regional Internet registries (RIRs). 

By zooming in a little more, you can see the ISPs appear. So, with just a glance, you can get an idea of the address range that an ISP owns

![image](https://user-images.githubusercontent.com/10708817/220412579-70dae992-893d-471f-8a50-af0c1c580aec.png)

### How it works
I rely on data from iana.org and ip2location to dynamically generate SVG tiles that are displayed using Leaflet. The data is regularly refreshed.

### Why don't you use a Hilbert Curve?
The reason is that when I started this project, I was not aware of Hilbert's work, so I found my own way of representing a set of numbers with a two-dimensional image. The representation used is very similar to Hilbert's, and in my opinion, more logical. I will try to implement a switch to switch between representations in the near future.

![image](https://user-images.githubusercontent.com/10708817/220417773-6a1b2e16-c3be-414e-a851-90de88f21273.png)
