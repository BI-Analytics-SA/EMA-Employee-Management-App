DELETE FROM dbo.TMEW_CA_EmpImages
WHERE Emp_FK LIKE {{ collectionView1.selectedItem.ID }}