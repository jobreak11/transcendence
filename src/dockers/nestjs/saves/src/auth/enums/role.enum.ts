export enum Role {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  // GUEST ?
  /* 
    - should not have direct access to match history
    - dont have access to /user/profile
    - each client should have unique sessions (should provide
    public API to generate the guess JWT tokens (
      separate table? different refresh token than normal user
       - would have shorter expire time for guess user

      
    )
    )
  */
  USER = 'USER'
}