const handleAddAttachment = async (courseId) => {
    if (!attachmentFile) {
        await Swal.fire({
            icon: 'warning',
            title: 'No File Selected',
            text: 'Please select a file to upload as attachment.',
            confirmButtonColor: '#f39c12'
        });
        return;
    }

    setUploading(true);
    
    try {
        const token = localStorage.getItem('token');
        const formDataToSend = new FormData();
        
        // Try both field names to see which one works
        formDataToSend.append('file', attachmentFile); // Try this first
        // formDataToSend.append('attachment', attachmentFile); // If above fails, try this
        
        console.log('Trying field name: file');
        
        const response = await axios.post(
            `${process.env.REACT_APP_BACKEND_URL}/courses/${courseId}/attachments`,
            formDataToSend,
            { 
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                } 
            }
        );
        
        await Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Attachment uploaded successfully!',
            confirmButtonColor: '#27ae60',
            timer: 1500
        });
        
        setAttachmentFile(null);
        
        // Refresh courses list
        const userData = JSON.parse(localStorage.getItem("user"));
        const instructorId = userData.id || userData._id;
        fetchCourses(instructorId);
    } catch (error) {
        console.error('Error with field name "file":', error.response?.data);
        
        // If first attempt fails, try with field name "attachment"
        if (error.response?.status === 400) {
            try {
                console.log('Trying field name: attachment');
                const formDataToSend = new FormData();
                formDataToSend.append('attachment', attachmentFile);
                
                const retryResponse = await axios.post(
                    `${process.env.REACT_APP_BACKEND_URL}/courses/${courseId}/attachments`,
                    formDataToSend,
                    { 
                        headers: { 
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data'
                        } 
                    }
                );
                
                await Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Attachment uploaded successfully!',
                    confirmButtonColor: '#27ae60',
                    timer: 1500
                });
                
                setAttachmentFile(null);
                const userData = JSON.parse(localStorage.getItem("user"));
                const instructorId = userData.id || userData._id;
                fetchCourses(instructorId);
                return;
            } catch (retryError) {
                console.error('Error with field name "attachment":', retryError.response?.data);
                error = retryError;
            }
        }
        
        // Show error message
        let errorMessage = 'Failed to upload attachment';
        if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        await Swal.fire({
            icon: 'error',
            title: 'Upload Failed',
            text: errorMessage,
            confirmButtonColor: '#e74c3c'
        });
    } finally {
        setUploading(false);
    }
};