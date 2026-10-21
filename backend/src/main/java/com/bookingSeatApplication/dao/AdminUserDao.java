package com.bookingSeatApplication.dao;

import com.bookingSeatApplication.model.AdminUser;

public interface AdminUserDao {

    AdminUser findByUsername(String username);

    void save(AdminUser adminUser);
}
