package com.bookingSeatApplication.service;

import com.bookingSeatApplication.model.AdminUser;

public interface AdminUserService {

    boolean login(String username, String password);

    void addAdmin(AdminUser adminUser);
}
