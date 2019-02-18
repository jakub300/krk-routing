mkdir -p ./data/tram
mkdir -p ./data/bus
wget -q ftp://ztp.krakow.pl/GTFS_KRK_T.zip
wget -q ftp://ztp.krakow.pl/GTFS_KRK_A.zip
unzip -d ./data/tram ./GTFS_KRK_T.zip
unzip -d ./data/bus ./GTFS_KRK_A.zip
