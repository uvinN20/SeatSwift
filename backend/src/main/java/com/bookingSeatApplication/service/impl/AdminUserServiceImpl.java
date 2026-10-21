package com.bookingSeatApplication.service.impl;

import com.bookingSeatApplication.dao.AdminUserDao;
import com.bookingSeatApplication.model.AdminUser;
import com.bookingSeatApplication.service.AdminUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AdminUserServiceImpl implements AdminUserService {

    @Autowired
    private AdminUserDao adminUserDao;

    @Autowired
    private PasswordEncoder passwordEncoder;


    @Override
    public boolean login(String username, String password) {


        if(username == null || username.isEmpty()){
            throw new IllegalArgumentException("Username cannot be empty");
        }

        if(password == null || password.isEmpty()){
            throw new IllegalArgumentException("Password cannot be empty");
        }

        AdminUser adminUser = adminUserDao.findByUsername(username);

        if(adminUser == null){
            return false;
        }



        return passwordEncoder.matches(password, adminUser.getPassword());

    }


    @Override
    public void addAdmin(AdminUser adminUser) {

        try{

            adminUser.setPassword(
                    passwordEncoder.encode(adminUser.getPassword())
            );

            adminUserDao.save(adminUser);

        }
        catch(Exception e){
            throw new RuntimeException("Error adding admin", e);
        }
    }
}