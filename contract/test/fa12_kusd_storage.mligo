{
  tokens = ( Big_map.literal [("tz1VApBuWHuaTfDHtKzU3NBtWFYsxJvvWhYk" : address), 100000000000000n] :
               (address, nat) big_map) ;
  allowances = (Big_map.empty : allowances) ;
  admin = ("tz1VApBuWHuaTfDHtKzU3NBtWFYsxJvvWhYk" : address) ;
  total_supply = 100000000000000n ;
  metadata = ( Big_map.literal [("", (0x74657a6f732d73746f726167653a64617461:bytes)); ("data", (0x7b20226e616d65223a20224b6f6c6962726920546f6b656e20436f6e7472616374222c20226465736372697074696f6e223a20224641312e3220496d706c656d656e746174696f6e206f66206b555344222c2022617574686f7273223a205b22486f766572204c616273203c68656c6c6f40686f7665722e656e67696e656572696e673e225d2c2022686f6d6570616765223a20202268747470733a2f2f6b6f6c696272692e66696e616e6365222c2022696e7465726661636573223a205b2022545a49502d3030372d323032312d30312d3239225d207d:bytes)) ] :
               contract_metadata) ;
  token_metadata = ( Big_map.literal [
    (0n, 
      {token_id=0n; token_info=Map.literal [
        ("decimals", (0x3138:bytes)) ; 
        ("name", (0x4b6f6c6962726920555344:bytes)) ; 
        ("symbol", (0x6b555344:bytes)) ; 
        ("thumbnailUri", (0x2068747470733a2f2f6b6f6c696272692d646174612e73332e616d617a6f6e6177732e636f6d2f6c6f676f2e706e67:bytes)) ;
      ]
      })] : token_metadata_storage);
}