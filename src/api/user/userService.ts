import User, { IUser } from './userModel';

export const findUserByEmail = async (email: string): Promise<IUser | null> => {
    return await User.findOne({ email });
};

export const findUserById = async (id: string): Promise<IUser | null> => {
    return await User.findById(id);
};

export const createUser = async (userData: { name: string; email: string; googleId: string }): Promise<IUser> => {
    return await User.create(userData);
};
// ----------------

// Define strictly what fields a user is permitted to update
type UpdateableFields = Pick<IUser, 'name'>;

export const updateUserProfile = async (id: string, updateData: UpdateableFields): Promise<IUser | null> => {
    return await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
};

export const saveRefreshToken = async (id: string, refreshToken: string): Promise<void> => {
    await User.findByIdAndUpdate(id, { refreshToken });
};

export const clearRefreshToken = async (id: string): Promise<void> => {
    await User.findByIdAndUpdate(id, { $unset: { refreshToken: 1 } });
};