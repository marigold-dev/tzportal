{
  tokens = ( Big_map.literal [("tz1VApBuWHuaTfDHtKzU3NBtWFYsxJvvWhYk" : address), 100000000n] :
               (address, nat) big_map) ;
  allowances = (Big_map.empty : allowances) ;
  admin = ("tz1VApBuWHuaTfDHtKzU3NBtWFYsxJvvWhYk" : address) ;
  total_supply = 100000000n ;
  metadata = ( Big_map.literal [("", (0x697066733a2f2f516d62426663684b755a3153324a4e5052506a456a444c74637879666270616e6e4a617a34487764715552425262:bytes))] :
               contract_metadata) ;
  token_metadata = ( Big_map.literal [
    (0n, 
      {token_id=0n; token_info=Map.literal [
        ("decimals", (0x36:bytes)) ; 
        ("name", (0x4374657a:bytes)) ; 
        ("symbol", (0x6374657a:bytes)) ; 
        ("thumbnailUri", (0x697066733a2f2f516d6534796261646259344838346835574c506a646f34375951557878566f4a48575a72775971324a5a72694d34:bytes)) ;
      ]
      })] : token_metadata_storage);
}