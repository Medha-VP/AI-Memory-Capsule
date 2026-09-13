import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  type UserRole = {
    #admin;
    #user;
    #guest;
  };

  type AccessControlState = {
    var adminAssigned : Bool;
    userRoles : Map.Map<Principal, UserRole>;
  };

  type DocumentCategory = {
    #education;
    #identity;
    #finance;
    #insurance;
    #projects;
    #achievements;
  };

  type Document = {
    id : Nat;
    owner : Principal;
    name : Text;
    fileType : Text;
    uploadedAt : Int;
    blob : Blob;
    category : DocumentCategory;
    metadata : [Text];
    summary : ?Text;
  };

  type DocumentsState = {
    var nextId : Nat;
  };

  type OldActor = {};

  type NewActor = {
    var accessControlState : AccessControlState;
    docs : Map.Map<Nat, Document>;
    state : DocumentsState;
  };

  public func migration(_old : OldActor) : NewActor {
    {
      var accessControlState = {
        var adminAssigned = false;
        userRoles = Map.empty();
      };
      docs = Map.empty();
      state = { var nextId = 0 };
    };
  };
};
