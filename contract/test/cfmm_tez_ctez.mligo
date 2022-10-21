//#define ORACLE
#define CASH_IS_TEZ
#define CTEZ_CONTRACT

[@inline] let const_fee = 10000n (* 0% fee *)
[@inline] let const_fee_denom = 10000n
#include "cfmm.mligo"