package com.bookingSeatApplication.model;

/** Internal account record. Never serialize this record in an API response. */
public record OwnerUser(int ownerId, String username, String fullName, String phoneNumber,
                        String password, boolean active, String approvalStatus) {}
