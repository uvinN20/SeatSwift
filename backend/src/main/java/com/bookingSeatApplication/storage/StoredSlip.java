package com.bookingSeatApplication.storage;

public record StoredSlip(String storedName, String originalName, String contentType, long sizeBytes, String sha256) {}
